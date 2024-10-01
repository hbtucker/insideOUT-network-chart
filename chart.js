// chart.js
const width = 1200;
const height = 800;
const colors = ["#b1b1b1", "#f6f6f6", "#ffc433", "#f4a261", "#e76f51"];

function chart(data) {
  const links = data.links.map(d => Object.create(d));
  const nodes = data.nodes.map(d => Object.create(d));

  const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(50))
      .force("charge", d3.forceManyBody().strength(d => -150 * (d.level === "1" ? 3 : d.level === "2" ? 2 : 1)))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.06))
      .force("y", d3.forceY(height / 2).strength(0.06));

  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height]);

  const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
      .attr("stroke-width", d => d.relationship ? 2 : 1);

  const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
      .attr("r", d => d.level === "1" ? 30 : d.level === "2" ? 20 : 10)
      .attr("fill", d => colors[d.level - 1]);

  const label = svg.append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .text(d => d.id)
      .style("font-family", "'Poppins', sans-serif")
      .attr("font-size", d => d.level === "1" ? "9px" : d.level === "2" ? "7px" : "5px")
      .attr("fill", "black")
      .style("pointer-events", "none");

  const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

  node.on("mouseover", (event, d) => {
    tooltip.transition()
      .duration(200)
      .style("opacity", .9);
    tooltip.html(d.tooltip)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 28) + "px");
  })
  .on("mouseout", () => {
    tooltip.transition()
      .duration(500)
      .style("opacity", 0);
  });

  simulation.on("tick", () => {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

    label
        .attr("x", d => d.x)
        .attr("y", d => d.y);
  });

  const drag = d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);

  node.call(drag);

  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return svg.node();
}

// Load data and create chart
d3.json("data_org-chart-network.json").then(data => {
  const chartElement = chart(data);
  document.getElementById("chart").appendChild(chartElement);
}).catch(error => console.error("Error loading the data: ", error));
