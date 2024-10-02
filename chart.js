const width = 1200;
const height = 800;
const colors = ["#b1b1b1", "#f6f6f6", "#ffc433", "#f4a261", "#e76f51"];

function chart(data) {
  const links = data.links.map(d => Object.create(d));
  const nodes = data.nodes.map(d => Object.create(d));

  // Add connections between top-level departments
  const departments = nodes.filter(d => d.level === "1");
  for (let i = 0; i < departments.length; i++) {
    for (let j = i + 1; j < departments.length; j++) {
      links.push({
        source: departments[i].id,
        target: departments[j].id,
        relationship: "Department Connection"
      });
    }
  }

  // Custom force to separate nodes by level
  function forceByLevel(alpha) {
    const centerX = width / 2;
    const centerY = height / 2;
    const departmentRadius = 100;
    const teamRadius = 250;
    const maxAngle = Math.PI / 10; // About 30 degrees in radians

    // Group teams by department
    const teamsByDepartment = {};
    nodes.forEach(node => {
      if (node.level === "2") {
        const parent = links.find(link => link.target === node.id)?.source;
        if (parent) {
          if (!teamsByDepartment[parent]) {
            teamsByDepartment[parent] = [];
          }
          teamsByDepartment[parent].push(node);
        }
      }
    });

    for (let node of nodes) {
      if (node.level === "1") {
        const angle = (2 * Math.PI * departments.indexOf(node)) / departments.length;
        node.x += (centerX + Math.cos(angle) * departmentRadius - node.x) * alpha;
        node.y += (centerY + Math.sin(angle) * departmentRadius - node.y) * alpha;
      } else if (node.level === "2") {
        const parent = links.find(link => link.target === node.id)?.source;
        if (parent) {
          const parentNode = nodes.find(n => n.id === parent);
          if (parentNode) {
            const departmentIndex = departments.findIndex(d => d.id === parent);
            const departmentAngle = (2 * Math.PI * departmentIndex) / departments.length;
            const teamCount = teamsByDepartment[parent].length;
            const teamIndex = teamsByDepartment[parent].indexOf(node);
            
            // Calculate team angle within the max angle range, relative to the department angle
            const teamAngleOffset = maxAngle * ((teamIndex - (teamCount - 1) / 2) / (teamCount - 1));
            const teamAngle = departmentAngle + teamAngleOffset;
            
            const x = centerX + Math.cos(teamAngle) * teamRadius;
            const y = centerY + Math.sin(teamAngle) * teamRadius;
            node.x += (x - node.x) * alpha * 2;
            node.y += (y - node.y) * alpha * 2;
          }
        }
      } else if (node.level === "3") {
        const parent = links.find(link => link.target === node.id)?.source;
        if (parent) {
          const parentNode = nodes.find(n => n.id === parent);
          if (parentNode) {
            const angle = Math.atan2(parentNode.y - centerY, parentNode.x - centerX);
            const individualRadius = 30;
            const x = parentNode.x + Math.cos(angle) * individualRadius;
            const y = parentNode.y + Math.sin(angle) * individualRadius;
            node.x += (x - node.x) * alpha;
            node.y += (y - node.y) * alpha;
          }
        }
      }
    }
  }

  const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(d => {
        if (d.relationship === "Department Connection") return 80;
        if (d.source.level === "1" && d.target.level === "2") return 10;
        return 30;
      }))
      .force("charge", d3.forceManyBody().strength(d => {
        if (d.level === "1") return -80;
        if (d.level === "2") return -10;
        return -55;
      }))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => {
        if (d.level === "1") return 40;
        if (d.level === "2") return 15;
        return 15;
      }))
      .force("byLevel", forceByLevel);

  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height]);

  // Add background
  svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#fff");

  const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
      .attr("stroke-width", d => d.relationship ? 1.5 : 1)
      .attr("stroke-dasharray", d => d.relationship === "Department Connection" ? "5,5" : "none");

  const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
      .attr("r", d => d.level === "1" ? 30 : d.level === "2" ? 25 : 15)
      .attr("fill", d => colors[d.level - 1]);

  const label = svg.append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .text(d => d.id)
      .attr("font-size", d => d.level === "1" ? "10px" : d.level === "2" ? "7px" : "5px")
      .attr("fill", "black")
      .style("font-family", "Poppins, sans-serif")
      .style("pointer-events", "none");

const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "1px solid #f6f6f6")
      .style("font-family", "Poppins, sans-serif")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style("pointer-events", "none");

  node.on("mouseover", (event, d) => {
    tooltip.transition()
      .duration(200)
      .style("opacity", .9);
    tooltip.html(d.tooltip || d.id)
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
