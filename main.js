import React from 'react';
import ReactDOM from 'react-dom';
import Chart from './chart';

async function loadData() {
  const response = await fetch('data_org-chart-network.json');
  return await response.json();
}

function App() {
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    loadData().then(setData);
  }, []);

  if (!data) return <div>Loading...</div>;

  return <Chart data={data} />;
}

ReactDOM.render(<App />, document.getElementById('chart'));
