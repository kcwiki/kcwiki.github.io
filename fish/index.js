const charts = document.getElementsByClassName('container')[0]

const data = window.chartData

for (const place of Object.keys(data)) {
  if (window.isPlayerChart && !place.match(/^\d-\d .$/)) {
    continue
  }
  {
    const chart = document.createElement('div')
    chart.id = place
    charts.appendChild(chart)
  }
  Highcharts.chart(place, {
    title: { text: place },
    xAxis: { type: window.isPlayerChart ? undefined : 'datetime', allowDecimals: false },
    yAxis: { title: { text: '%' }, min: 0 },
    tooltip: { shared: true, valueSuffix: '%' },
    series: [
      {
        name: 'S',
        data: data[place].sRate,
        marker: { enabled: false },
      },
      {
        name: 'S 95% CI',
        data: data[place].sCI,
        type: 'arearange',
        lineWidth: 0,
        color: Highcharts.getOptions().colors[0],
        fillOpacity: 0.3,
        marker: { enabled: false },
      },
      {
        name: 'A',
        data: data[place].aRate,
        marker: { enabled: false },
      },
      {
        name: 'A 95% CI',
        data: data[place].aCI,
        type: 'arearange',
        lineWidth: 0,
        color: Highcharts.getOptions().colors[2],
        fillOpacity: 0.3,
        marker: { enabled: false },
      },
    ],
  })
}
