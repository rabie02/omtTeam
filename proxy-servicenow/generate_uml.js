const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');

// Load all models
const modelsPath = path.join(__dirname, './models');
fs.readdirSync(modelsPath).forEach((file) => {
  require(path.join(modelsPath, file));
});

let mermaid = 'classDiagram\n\n';
const relationships = new Set();

// Build the undirected graph of model references
const graph = new Map();

// Initialize graph with all model names
mongoose.modelNames().forEach(modelName => {
  graph.set(modelName, new Set());
});

// Populate the graph with relationships
mongoose.modelNames().forEach(modelName => {
  const schema = mongoose.model(modelName).schema;

  schema.eachPath((pathName, type) => {
    const pathObj = schema.path(pathName);
    let refModel;

    // Check for direct reference
    if (pathObj.options.ref) {
      refModel = pathObj.options.ref;
    }
    // Check for array of references
    else if (type.instance === 'Array') {
      const caster = pathObj.caster;


      if (caster && caster.options?.ref) {
        refModel = caster.options.ref;
      }
    }

    if (refModel) {
      // Add undirected edges to graph
      graph.get(modelName).add(refModel);
      graph.get(refModel).add(modelName);
      // Add relationship for Mermaid
      relationships.add(`${modelName} --> ${refModel} : "${pathName}"`);
    }
  });
});

// Find connected components using BFS
const visited = new Set();
const components = [];

mongoose.modelNames().forEach(modelName => {
  if (!visited.has(modelName)) {
    const component = [];
    const queue = [modelName];
    visited.add(modelName);

    while (queue.length > 0) {
      const current = queue.shift();
      component.push(current);

      graph.get(current).forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }
    components.push(component);
  }
});

// Generate subgraphs for each component
components.forEach((component, index) => {
  mermaid += `  subgraph Component_${index + 1}\n`;
  component.forEach(modelName => {
    const schema = mongoose.model(modelName).schema;

    mermaid += `    class ${modelName} {\n`;
    schema.eachPath((pathName, type) => {
      const fieldOptions = schema.path(pathName).options;
      const constraints = [
        fieldOptions.required ? 'required' : null,
        fieldOptions.unique ? 'unique' : null,
        fieldOptions.enum ? `enum: [${fieldOptions.enum.join(',')}]` : null,
        fieldOptions.default !== undefined ? `default: ${JSON.stringify(fieldOptions.default)}` : null
      ].filter(Boolean).join(', ');

      mermaid += `      +${type.instance} ${pathName}${constraints ? ` (${constraints})` : ''}\n`;
    });
    mermaid += '    }\n';
  });
  mermaid += '  end\n\n';
});

// Add relationships to the diagram
relationships.forEach(rel => mermaid += `  ${rel}\n`);

// Save to file
fs.writeFileSync('uml-with-relationships.mmd', mermaid);
console.log('UML diagram with relationships generated!');