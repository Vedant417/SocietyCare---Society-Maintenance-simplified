const Complaint = require("../models/Complaint");
const SystemSetting = require("../models/SystemSetting");

async function getOverdueThresholdDays() {
  try {
    const setting = await SystemSetting.findOne({ key: "complaint_overdue_days" });
    return setting ? parseInt(setting.value, 10) : parseInt(process.env.OVERDUE_DAYS || "3", 10);
  } catch {
    return 3;
  }
}

async function getDashboardData(req, res, next) {
  try {
    const overdueDays = await getOverdueThresholdDays();
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - overdueDays);

    const baseFilter = req.user.role === "RESIDENT" ? { residentId: req.user.id } : {};

    // KPI counts
    const [total, openCount, inProgressCount, resolvedCount] = await Promise.all([
      Complaint.countDocuments(baseFilter),
      Complaint.countDocuments({ ...baseFilter, status: "OPEN" }),
      Complaint.countDocuments({ ...baseFilter, status: "IN_PROGRESS" }),
      Complaint.countDocuments({ ...baseFilter, status: "RESOLVED" }),
    ]);

    const overdueCount = await Complaint.countDocuments({
      ...baseFilter,
      status: { $ne: "RESOLVED" },
      createdAt: { $lt: thresholdDate },
    });

    // Escalation count: HIGH priority + overdue + unresolved (Phase 3)
    const escalationCount = await Complaint.countDocuments({
      ...baseFilter,
      status: { $ne: "RESOLVED" },
      priority: "HIGH",
      createdAt: { $lt: thresholdDate },
    });

    // Status chart
    const statusChart = [
      { name: "Open", value: openCount, color: "#635BFF" },
      { name: "In Progress", value: inProgressCount, color: "#F59E0B" },
      { name: "Resolved", value: resolvedCount, color: "#20B486" },
    ];

    // Category chart
    const categoryAgg = await Complaint.aggregate([
      { $match: baseFilter },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const categoryChart = categoryAgg.map((c) => ({ category: c._id, count: c.count }));

    // Trend: last 7 days (complaints created per day)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().substring(0, 10));
    }

    const trendAgg = await Complaint.aggregate([
      {
        $match: {
          ...baseFilter,
          createdAt: { $gte: new Date(last7Days[0]) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);

    const trendMap = {};
    trendAgg.forEach((t) => { trendMap[t._id] = t.count; });

    const finalTrendChart = last7Days.map((d) => ({
      date: d,
      Complaints: trendMap[d] || 0,
    }));

    // Needs attention: overdue, high-priority, or new in last 24h
    const date24HoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const allActive = await Complaint.find({
      ...baseFilter,
      status: { $ne: "RESOLVED" },
    })
      .populate("residentId", "name apartmentNumber")
      .lean();

    const needsAttentionList = allActive
      .map((c) => {
        const isOverdue = new Date(c.createdAt) < thresholdDate;
        const isHighPriority = c.priority === "HIGH";
        const isRecent = c.status === "OPEN" && new Date(c.createdAt) >= date24HoursAgo;
        const isEscalated = isOverdue && isHighPriority;

        let reason = "";
        let severity = 0;
        if (isEscalated) { reason = "Escalated"; severity = 4; }
        else if (isOverdue) { reason = "Overdue"; severity = 3; }
        else if (isHighPriority) { reason = "High Priority"; severity = 2; }
        else if (isRecent) { reason = "New"; severity = 1; }

        return {
          ...c,
          id: c._id.toString(),
          residentId: c.residentId?._id?.toString(),
          resident: c.residentId ? { name: c.residentId.name, apartmentNumber: c.residentId.apartmentNumber } : null,
          isOverdue,
          attentionReason: reason,
          attentionSeverity: severity,
          escalationLevel: isEscalated ? "ESCALATED" : isOverdue ? "OVERDUE" : "HEALTHY",
        };
      })
      .filter((c) => c.attentionSeverity > 0)
      .sort((a, b) => {
        if (b.attentionSeverity !== a.attentionSeverity) return b.attentionSeverity - a.attentionSeverity;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

    return res.status(200).json({
      success: true,
      data: {
        kpis: { total, open: openCount, inProgress: inProgressCount, resolved: resolvedCount, overdue: overdueCount, escalated: escalationCount },
        charts: { status: statusChart, category: categoryChart, trend: finalTrendChart },
        needsAttention: needsAttentionList.slice(0, 5),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get recurring issues: same category appearing 3+ times in last 90 days (Phase 2)
 */
async function getRecurringIssues(req, res, next) {
  try {
    const windowDate = new Date();
    windowDate.setDate(windowDate.getDate() - 90);

    const agg = await Complaint.aggregate([
      { $match: { createdAt: { $gte: windowDate } } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          complaintIds: { $push: "$_id" },
          statuses: { $push: "$status" },
          latestDate: { $max: "$createdAt" },
        },
      },
      { $match: { count: { $gte: 3 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const issues = agg.map((item) => ({
      category: item._id,
      count: item.count,
      complaintIds: item.complaintIds.map((id) => id.toString()),
      latestDate: item.latestDate,
      unresolvedCount: item.statuses.filter((s) => s !== "RESOLVED").length,
    }));

    return res.status(200).json({ success: true, data: issues });
  } catch (error) {
    next(error);
  }
}

/**
 * Compute Society Maintenance Health Score (Phase 5)
 * Returns 0-100 score with breakdown and monthly insights
 */
async function getHealthScore(req, res, next) {
  try {
    const overdueDays = await getOverdueThresholdDays();
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - overdueDays);

    const now = new Date();

    // --- Month ranges ---
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalComplaints,
      resolvedComplaints,
      overdueComplaints,
      allComplaints,
      thisMonthComplaints,
      lastMonthComplaints,
      satisfactionRatings,
    ] = await Promise.all([
      Complaint.countDocuments({}),
      Complaint.countDocuments({ status: "RESOLVED" }),
      Complaint.countDocuments({ status: { $ne: "RESOLVED" }, createdAt: { $lt: thresholdDate } }),
      Complaint.find({}).select("status priority category createdAt resolvedAt residentId history satisfactionRating").populate("residentId", "apartmentNumber").lean(),
      Complaint.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      Complaint.countDocuments({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
      Complaint.find({ satisfactionRating: { $ne: null } }).select("satisfactionRating").lean(),
    ]);

    // --- Sub-score 1: Resolution Speed (25 pts) ---
    // % of complaints resolved within SLA
    const resolvedWithinSLA = allComplaints.filter((c) => {
      if (c.status !== "RESOLVED" || !c.resolvedAt) return false;
      const diffDays = (new Date(c.resolvedAt) - new Date(c.createdAt)) / (1000 * 60 * 60 * 24);
      return diffDays <= overdueDays;
    }).length;
    const resolutionSpeedScore = totalComplaints > 0
      ? Math.round((resolvedWithinSLA / totalComplaints) * 25)
      : 25;

    // --- Sub-score 2: Overdue Rate (25 pts, inverse) ---
    const activeComplaints = totalComplaints - resolvedComplaints;
    const overdueRate = activeComplaints > 0 ? overdueComplaints / activeComplaints : 0;
    const overdueScore = Math.round((1 - Math.min(overdueRate, 1)) * 25);

    // --- Sub-score 3: Resident Satisfaction (20 pts) ---
    let satisfactionScore = 10; // neutral default if no ratings yet
    if (satisfactionRatings.length > 0) {
      const ratingMap = { SATISFIED: 1, NEUTRAL: 0.5, NOT_SATISFIED: 0 };
      const avgRating = satisfactionRatings.reduce((sum, r) => sum + (ratingMap[r.satisfactionRating] || 0), 0) / satisfactionRatings.length;
      satisfactionScore = Math.round(avgRating * 20);
    }

    // --- Sub-score 4: Recurring Issues (15 pts, inverse) ---
    const windowDate = new Date();
    windowDate.setDate(windowDate.getDate() - 90);
    const recurringAgg = await Complaint.aggregate([
      { $match: { createdAt: { $gte: windowDate } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $match: { count: { $gte: 3 } } },
    ]);
    const recurringCount = recurringAgg.length;
    const recurringScore = Math.max(0, 15 - recurringCount * 3); // -3 pts per recurring category

    // --- Sub-score 5: Response Performance (15 pts) ---
    // Avg days to first IN_PROGRESS transition
    const complaintsWithResponse = allComplaints.filter((c) => {
      return c.history && c.history.some((h) => h.status === "IN_PROGRESS");
    });
    let responseScore = 15; // perfect if no data
    if (complaintsWithResponse.length > 0) {
      const totalResponseDays = complaintsWithResponse.reduce((sum, c) => {
        const firstResponse = c.history.find((h) => h.status === "IN_PROGRESS");
        if (!firstResponse) return sum;
        return sum + (new Date(firstResponse.createdAt) - new Date(c.createdAt)) / (1000 * 60 * 60 * 24);
      }, 0);
      const avgResponseDays = totalResponseDays / complaintsWithResponse.length;
      // Target: respond within 1 day = 15 pts, 3 days = 7.5 pts, 5+ days = 0 pts
      responseScore = Math.max(0, Math.round(15 - (avgResponseDays / overdueDays) * 15));
    }

    const totalScore = resolutionSpeedScore + overdueScore + satisfactionScore + recurringScore + responseScore;

    // --- Monthly Insights ---
    const monthChange = lastMonthComplaints > 0
      ? Math.round(((thisMonthComplaints - lastMonthComplaints) / lastMonthComplaints) * 100)
      : thisMonthComplaints > 0 ? 100 : 0;

    // Most common category this month
    const categoryAgg = await Complaint.aggregate([
      { $match: { createdAt: { $gte: thisMonthStart } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    const mostCommonCategory = categoryAgg.length > 0 ? categoryAgg[0]._id : "—";

    // Most affected area (apartment block) this month
    const areaAgg = await Complaint.aggregate([
      { $match: { createdAt: { $gte: thisMonthStart } } },
      {
        $lookup: {
          from: "users",
          localField: "residentId",
          foreignField: "_id",
          as: "resident",
        },
      },
      { $unwind: { path: "$resident", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            $cond: [
              { $ifNull: ["$resident.apartmentNumber", false] },
              { $substr: ["$resident.apartmentNumber", 0, 1] }, // First char = block
              "Unknown",
            ],
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    const mostAffectedArea = areaAgg.length > 0 && areaAgg[0]._id ? `Block ${areaAgg[0]._id}` : "—";

    // Average resolution time (days) this month
    const resolvedThisMonth = allComplaints.filter((c) =>
      c.status === "RESOLVED" && c.resolvedAt && new Date(c.createdAt) >= thisMonthStart
    );
    let avgResolutionTime = null;
    if (resolvedThisMonth.length > 0) {
      const totalDays = resolvedThisMonth.reduce((sum, c) => {
        return sum + (new Date(c.resolvedAt) - new Date(c.createdAt)) / (1000 * 60 * 60 * 24);
      }, 0);
      avgResolutionTime = (totalDays / resolvedThisMonth.length).toFixed(1);
    }

    // Most recurring issue in 90 days
    const topRecurring = recurringAgg.length > 0
      ? recurringAgg.sort((a, b) => b.count - a.count)[0]._id
      : null;

    return res.status(200).json({
      success: true,
      data: {
        score: Math.min(100, totalScore),
        breakdown: {
          resolutionSpeed: { score: resolutionSpeedScore, max: 25, label: "Resolution Speed" },
          overdueRate: { score: overdueScore, max: 25, label: "Overdue Rate" },
          residentSatisfaction: { score: satisfactionScore, max: 20, label: "Resident Satisfaction" },
          recurringIssues: { score: recurringScore, max: 15, label: "Recurring Issues" },
          responsePerformance: { score: responseScore, max: 15, label: "Response Performance" },
        },
        monthlyInsights: {
          complaintsThisMonth: thisMonthComplaints,
          monthChange,
          mostCommonCategory,
          mostAffectedArea,
          avgResolutionTime,
          topRecurringIssue: topRecurring,
          ratingsCount: satisfactionRatings.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboardData, getRecurringIssues, getHealthScore };


