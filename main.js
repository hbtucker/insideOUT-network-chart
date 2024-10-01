// main.js
const forceVariables = {
  nodeRadius: 30,
  nodeDistance: 70,
  chargeStr: -700,
  xDenom: 2,
  xStr: 0.1,
  yDenom: 0.9,
  yStr: 0.1
};

function getRadius(group, level) {
  if (level === "2") {
    return 50; // Twice the size for team nodes
  } else if (level === "1") {
    return 65; // Even larger for top-level departments
  } else {
    return 25; // Original size for individual nodes
  }
}

function groupColor(group) {
  switch (group) {
    case 'Engineering': return '#4285F4';
    case 'Product Management': return '#0F9D58';
    case 'Governance': return '#DB4437';
    case 'Sales': return '#F4B400';
    default: return '#9E9E9E';
  }
}

function idCompress(id) {
  return id.split(' ').join('');
}

function buildToolTip(d, type, toolTip, event) {
  var rows = [];
  if (type === "link") {
    rows.push(["Connection", d.relationship || `${d.source.id} to ${d.target.id}`]);
  } else if (type === "node") {
    rows.push([d.id, d.tooltip]);
  }
  
  toolTip.html(rows.map(row => `<span>${row[0]}:<mark>${row[1]}</mark></span>`).join(''))
    .style('opacity', 0.9)
    .style("left", (event.pageX + 28) + "px")
    .style("top", (event.pageY - 28) + "px");
}

function drag(simulation) {
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
  
  return d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}

// Load data and create chart
d3.json("data_org-chart-network.json").then(data => {
  const width = 1200;
  const height = 800;
  const chartElement = document.getElementById("chart");

  chart(data, d3, forceVariables, getRadius, width, height, chartElement, groupColor, buildToolTip, drag, idCompress);
}).catch(error => console.error("Error loading the data: ", error));
