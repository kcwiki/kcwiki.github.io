const formatRate = (i, n) => `${Math.round((1000 * i) / n) / 10}% (${i} / ${n})`

const render = item => {
  d3.json(`/food/data/${item.toLowerCase()}.json`, config => {
    d3.csv(
      `/food/data/${item.toLowerCase()}.csv`,
      d => ({
        row: +d.row,
        col: +d.col,
        hsa: +d.hsa,
        hs: +d.hs,
        ha: +d.ha,
        thsa: +d.thsa,
        ths: +d.ths,
        tha: +d.tha,
        scale: +d.hsa > 0 ? 1 + (+d.thsa >= 50 ? Math.floor((10 * +d.hsa) / +d.thsa) : 0) : 0,
      }),
      (_, data) => {
        const colorScale = d3.scale
          .quantile()
          .domain([0, config.colors.length - 1])
          .range(config.colors)
        const svg = d3
          .select(`#${item}`)
          .append('svg')
          .attr('width', config.cellSize * config.cols.length + 200)
          .attr('height', config.cellSize * config.rows.length + 200)
          .append('g')
          .attr('transform', 'translate(100, 150)')
        const rowLabels = svg
          .append('g')
          .selectAll('.rowLabelg')
          .data(config.rows)
          .enter()
          .append('text')
          .text(d => d)
          .attr('x', 0)
          .attr('y', (_, i) => i * config.cellSize + 2)
          .style('text-anchor', 'end')
          .attr('transform', `translate(-6, ${config.cellSize / 1.5})`)
          .attr('class', (_, i) => `rowLabel${item} text-mono r${i}`)
          .on('mouseover', function() {
            d3.select(this).classed('text-hover', true)
          })
          .on('mouseout', function() {
            d3.select(this).classed('text-hover', false)
          })
        const rowLabelsRight = svg
          .append('g')
          .selectAll('.rowLabelg')
          .data(config.rows)
          .enter()
          .append('text')
          .text((_, i) => data.filter(e => e.row === i + 1).reduce((a, d) => a + d.hsa, 0))
          .attr('x', config.cellSize * config.cols.length + 10)
          .attr('y', (_, i) => i * config.cellSize + 2)
          .attr('transform', `translate(-6, ${config.cellSize / 1.5})`)
          .attr('class', (_, i) => `rowLabelRight${item} text-mono r${i}`)
          .on('mouseover', function() {
            d3.select(this).classed('text-hover', true)
          })
          .on('mouseout', function() {
            d3.select(this).classed('text-hover', false)
          })
        const colLabels = svg
          .append('g')
          .selectAll('.colLabelg')
          .data(config.cols)
          .enter()
          .append('text')
          .text(d => d)
          .attr('x', 0)
          .attr('y', (_, i) => i * config.cellSize + 2)
          .style('text-anchor', 'left')
          .attr('transform', `translate(${config.cellSize / 2}, -6) rotate (-90)`)
          .attr('class', (_, i) => `colLabel${item} text-mono c${i}`)
          .on('mouseover', function() {
            d3.select(this).classed('text-hover', true)
          })
          .on('mouseout', function() {
            d3.select(this).classed('text-hover', false)
          })
        const legendCellSize = config.cellSize * 5
        const legend = svg
          .selectAll('.legend')
          .data([0, 1, 2, 3, 4, 5])
          .enter()
          .append('g')
          .attr('class', 'legend')
        legend
          .append('rect')
          .attr('x', (_, i) => 80 + legendCellSize * i)
          .attr('y', -160 + config.cellSize * 2)
          .attr('width', legendCellSize)
          .attr('height', config.cellSize)
          .style('fill', (_, i) => config.colors[i])
        legend
          .append('text')
          .attr('class', 'text-mono')
          .html(d => (d === 1 ? '10% / ?%' : `${d * 10}%`))
          .attr('width', legendCellSize)
          .attr('x', (_, i) => 80 + legendCellSize * i)
          .attr('y', -160 + config.cellSize * 4)
        const heatMap = svg
          .append('g')
          .attr('class', 'g3')
          .selectAll('.cellg')
          .data(data, d => `${d.row}:${d.col}`)
          .enter()
          .append('rect')
          .attr('x', d => (d.col - 1) * config.cellSize)
          .attr('y', d => (d.row - 1) * config.cellSize)
          .attr('class', d => `cell cell-border cr${d.row - 1} cc${d.col - 1}`)
          .attr('width', config.cellSize)
          .attr('height', config.cellSize)
          .style('fill', d => colorScale(d.scale))
          .on('mouseover', function(d) {
            d3.select(this).classed('cell-hover', true)
            d3.selectAll(`.rowLabel${item}`).classed('text-highlight', (_, ri) => ri == d.row - 1)
            d3.selectAll(`.rowLabelRight${item}`).classed('text-highlight', (_, ri) => ri == d.row - 1)
            d3.selectAll(`.colLabel${item}`).classed('text-highlight', (_, ci) => ci == d.col - 1)
            d3.select('#tooltip')
              .style('left', `${d3.event.pageX - config.cellSize * d.col}px`)
              .style('top', `${d3.event.pageY - 80}px`)
              .select('#value')
              .html(
                `${d.hsa} drop${d.hsa > 1 ? 's' : ''} at ${config.rows[d.row - 1]} from ${config.cols[d.col - 1]} to next 6 hours
<br>Hourly rates: ${
                  d.hs > 0 && d.ha > 0
                    ? `SA: ${formatRate(d.hsa, d.thsa)}, S: ${formatRate(d.hs, d.ths)}, A: ${formatRate(d.ha, d.tha)}`
                    : `${d.hs > 0 ? 'S' : 'A'}: ${formatRate(d.hsa, d.thsa)}`
                }`,
              )
            d3.select('#tooltip').classed('hidden', false)
          })
          .on('mouseout', function() {
            d3.select(this).classed('cell-hover', false)
            d3.selectAll(`.rowLabel${item}`).classed('text-highlight', false)
            d3.selectAll(`.rowLabelRight${item}`).classed('text-highlight', false)
            d3.selectAll(`.colLabel${item}`).classed('text-highlight', false)
            d3.select('#tooltip').classed('hidden', true)
          })
        $(`#${item}-status`).text(`June total drops: ${data.reduce((a, d) => a + d.hsa, 0)}`)
      },
    )
  })
}

$(() => {
  $('.tabs li').on('click', function() {
    $('.tabs li').removeClass('is-active')
    $(this).addClass('is-active')
    $('.tab').removeClass('is-active')
    $(`.tab[data-tab="${$(this).data('tab')}"]`).addClass('is-active')
  })
  render('Rice')
  render('Umeboshi')
  render('Nori')
  render('Tea')
})
