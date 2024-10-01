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

  // Custom force to position nodes
  function forceCluster() {
    const strength = 0.2;
    const centerX = width / 2;
    const centerY = height / 2;

    function force(alpha) {
      const l = Math.sqrt(width * width + height * height) / 4;
      for (let i = 0, n = data.nodes.length, node; i < n; ++i) {
        node = data.nodes[i];
        if (node.level === "1") {
          // Position departments in a circle
          const angle = (i / n) * 2 * Math.PI;
          const x = centerX + l * Math.cos(angle);
          const y = centerY + l * Math.sin(angle);
          node.vx += (x - node.x) * alpha * strength;
          node.vy += (y - node.y) * alpha * strength;
        } else if (node.level === "2") {
          // Position teams around their department
          const parent = data.nodes.find(d => d.id === node.parent);
          if (parent) {
            const angle = Math.atan2(parent.y - centerY, parent.x - centerX);
            const x = parent.x + l * 0.5 * Math.cos(angle);
            const y = parent.y + l * 0.5 * Math.sin(angle);
            node.vx += (x - node.x) * alpha * strength;
            node.vy += (y - node.y) * alpha * strength;
          }
        }
      }
    }

    force.initialize = _ => {};

    return force;
  }

  const simulation = d3.forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.links).id(d => d.id).distance(d => d.source.level === "1" && d.target.level === "1" ? 300 : 100))
    .force("charge", d3.forceManyBody().strength(d => d.level === "1" ? -500 : d.level === "2" ? -300 : -100))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide().radius(d => d.level === "1" ? 80 : d.level === "2" ? 50 : 20))
    .force("cluster", forceCluster());

  const link = svg.append("g")
    .selectAll("line")
    .data(data.links)
    .enter().append("line")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", d => d.source.level === "1" && d.target.level === "1" ? 2 : 1)
    .attr("stroke-dasharray", d => d.source.level === "1" && d.target.level === "1" ? "5,5" : "none");

  const node = svg.append("g")
    .selectAll("g")
    .data(data.nodes)
    .enter().append("g");

  node.append("circle")
    .attr("r", d => d.level === "1" ? 60 : d.level === "2" ? 40 : 30)
    .attr("fill", d => colors[d.level === "1" ? "department" : d.level === "2" ? "team" : "individual"]);

  node.append("text")
    .text(d => d.id)
    .attr("text-anchor", "middle")
    .attr("dy", ".3em")
    .attr("font-size", d => d.level === "1" ? "10px" : d.level === "2" ? "8px" : "7px")
    .attr("fill", "black")
    .style("font-family", "Poppins, sans-serif")
    .style("pointer-events", "none");

  simulation.on("tick", ticked);

  function ticked() {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("transform", d => `translate(${d.x},${d.y})`);
  }

  const drag = d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);

  node.call(drag);

  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}

// Load data and create chart
d3.json("data_org-chart-network.json").then(data => {
  createChart(data);
}).catch(error => console.error("Error loading the data: ", error));
