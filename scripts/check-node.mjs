const [major] = process.versions.node.split('.').map(Number);
if (major < 22) {
  console.error(`❌ Node ${process.versions.node} found. This project needs Node 22+ (see .nvmrc).`);
  process.exit(1);
}
console.log(`✓ Node ${process.versions.node}`);
