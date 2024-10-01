// chart.js
const width = 1200;
const height = 800;
const colors = {
  department: "#f6f6f6",
  team: "#b1b1b1",
  individual: "#ffc433"
};

function createChart(data) {
  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Separate nodes by level
  const departmentNodes = data.nodes.filter(d => d.level === "1");
  const teamNodes = data.nodes.filter(d => d.level === "2");
  const individualNodes = data.nodes.filter(d => d.level === "3");

  // Create hierarchical structure
  const root = d3.stratify()
    .id(d => d.id)
    .parentId(d => d.parent)
    (data.nodes);

  // Create radial layout
  const radius = Math.min(width, height) / 2 - 100;
  const departmentRadius = radius * 0.4;
  const teamRadius = radius * 0.7;

  const departmentLayout = d3.radial()
    .radius(departmentRadius)
    .angle(d => d.x);

  const teamLayout = d3.radial()
    .radius(teamRadius)
    .angle(d => d.x);

  // Position departments
  const departmentAngle = 2 * Math.PI / departmentNodes.length;
  departmentNodes.forEach((d, i) => {
    const [x, y] = departmentLayout([{ x: i * departmentAngle }]);
    d.x = x + width / 2;
    d.y = y + height / 2;
  });

  // Position teams
  root.each(d => {
    if (d.depth === 1) {
      const parent = departmentNodes.find(p => p.id === d.parent.id);
      const siblings = d.parent.children;
      const siblingAngle = departmentAngle / (siblings.length + 1);
      const startAngle = Math.atan2(parent.y - height / 2, parent.x - width / 2) - departmentAngle / 2;
      siblings.forEach((child, i) => {
        const angle = startAngle + (i + 1) * siblingAngle;
        const [x, y] = teamLayout([{ x: angle }]);
        child.x = x + width / 2;
        child.y = y + height / 2;
      });
    }
  });

  // Position individuals
  individualNodes.forEach(d => {
    const parent = teamNodes.find(p => p.id === d.parent);
    const angle = Math.atan2(parent.y - height / 2, parent.x - width / 2);
    const distance = 40;
    d.x = parent.x + Math.cos(angle) * distance;
    d.y = parent.y + Math.sin(angle) * distance;
  });

  // Create links
  const departmentLinks = [];
  for (let i = 0; i < departmentNodes.length; i++) {
    for (let j = i + 1; j < departmentNodes.length; j++) {
      departmentLinks.push({
        source: departmentNodes[i],
        target: departmentNodes[j]
      });
    }
  }

  const teamLinks = data.links.filter(d => 
    d.source.level === "1" && d.target.level === "2" ||
    d.source.level === "2" && d.target.level === "3"
  );

  // Draw links
  svg.append("g")
    .selectAll("line")
    .data(departmentLinks)
    .enter().append("line")
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y)
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5,5");

  svg.append("g")
    .selectAll("line")
    .data(teamLinks)
    .enter().append("line")
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y)
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", 1);

  // Draw nodes
  const node = svg.append("g")
    .selectAll("g")
    .data(data.nodes)
    .enter().append("g")
    .attr("transform", d => `translate(${d.x},${d.y})`);

  node.append("circle")
    .attr("r", d => d.level === "1" ? 40 : d.level === "2" ? 30 : 20)
    .attr("fill", d => colors[d.level === "1" ? "department" : d.level === "2" ? "team" : "individual"]);

  node.append("text")
    .text(d => d.id)
    .attr("text-anchor", "middle")
    .attr("dy", ".3em")
    .attr("font-size", d => d.level === "1" ? "12px" : d.level === "2" ? "10px" : "8px")
    .attr("fill", "black");

  // Add drag behavior
  const drag = d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);

  node.call(drag);

  function dragstarted(event, d) {
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
    d.x = event.x;
    d.y = event.y;
    updateLinks();
  }

  function dragended(event, d) {
    d.fx = null;
    d.fy = null;
  }

  function updateLinks() {
    svg.selectAll("line")
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
  }
}

// Load data and create chart
d3.json("data_org-chart-network.json").then(data => {
  createChart(data);
}).catch(error => console.error("Error loading the data: ", error));
