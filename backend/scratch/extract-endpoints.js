const fs = require('fs');
const path = require('path');

function findControllers(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findControllers(filePath, fileList);
    } else if (filePath.endsWith('.controller.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const controllers = findControllers('c:/Users/USER/Desktop/SMS/school-management-system/backend/src');
const endpoints = new Set();

for (const file of controllers) {
  const content = fs.readFileSync(file, 'utf-8');
  let baseRoute = '';
  const controllerMatch = content.match(/@Controller\(['"]([^'"]+)['"]\)/);
  if (controllerMatch) {
    baseRoute = controllerMatch[1];
    if (!baseRoute.startsWith('/')) baseRoute = '/' + baseRoute;
  }
  
  const methods = ['Post', 'Put', 'Patch', 'Delete'];
  for (const method of methods) {
    // Match @Method('route')
    const regex = new RegExp(`@${method}\\(['"]([^'"]*)['"]\\)`, 'g');
    let match;
    while ((match = regex.exec(content)) !== null) {
      let subRoute = match[1];
      if (subRoute && !subRoute.startsWith('/')) subRoute = '/' + subRoute;
      let finalRoute = `${method.toUpperCase()} /api/v1${baseRoute}${subRoute}`.replace(/\/+/g, '/').toLowerCase();
      // Remove trailing slash
      if (finalRoute.endsWith('/')) finalRoute = finalRoute.slice(0, -1);
      // Remove path params like :id
      finalRoute = finalRoute.replace(/:[a-zA-Z0-9_]+/g, '');
      // Remove UUIDs
      finalRoute = finalRoute.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '');
      finalRoute = finalRoute.replace(/\/+/g, '/');
      if (finalRoute.endsWith('/')) finalRoute = finalRoute.slice(0, -1);

      endpoints.add(finalRoute);
    }
    
    // Match empty @Method()
    const emptyRegex = new RegExp(`@${method}\\(\\)`, 'g');
    if (emptyRegex.test(content)) {
      let finalRoute = `${method.toUpperCase()} /api/v1${baseRoute}`.replace(/\/+/g, '/').toLowerCase();
      if (finalRoute.endsWith('/')) finalRoute = finalRoute.slice(0, -1);
      endpoints.add(finalRoute);
    }
  }
}

fs.writeFileSync('c:/Users/USER/Desktop/SMS/school-management-system/backend/scratch/endpoints.txt', Array.from(endpoints).sort().join('\n'));
console.log('Found ' + endpoints.size + ' endpoints.');
