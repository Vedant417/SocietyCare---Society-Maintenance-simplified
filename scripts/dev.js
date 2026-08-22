const { spawn } = require("child_process");

const processes = [];

function start(command, args, name) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`${name} stopped.`);
    } else if (code !== 0) {
      console.error(`${name} exited with code ${code}.`);
    }
  });

  processes.push(child);

  return child;
}

// Start backend
start(
  "npm",
  ["run", "dev", "--prefix", "server"],
  "Server"
);

// Start frontend
start(
  "npm",
  ["run", "dev", "--prefix", "client"],
  "Client"
);

function shutdown() {
  console.log("\nStopping SocietyCare...");

  for (const child of processes) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }

  setTimeout(() => {
    for (const child of processes) {
      if (!child.killed) {
        child.kill();
      }
    }

    process.exit(0);
  }, 500);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);