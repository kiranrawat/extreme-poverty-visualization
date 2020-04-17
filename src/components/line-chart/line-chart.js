import React from 'react';
import './line-chart.css';
import * as d3 from "d3";
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';

class LineChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            id: 'linechart-' + uuidv4()
        };
    }

    convertToXY(csvData) {
        let csvDataKeys = Object.keys(csvData);
        let x = [], y = [];
        for (let i = 0; i < csvDataKeys.length; i++) {
            if (+csvDataKeys[i] > 0) {
                x.push(csvDataKeys[i]);
                y.push(+csvData[csvDataKeys[i]]);
            }
        }
        return { x, y, description: csvData['Indicator Name'], type: csvData['type'] };
    }

    componentDidMount() {
        this.initData().then((data) => {
            let chartData = [];
            for (let dataIdx = 0; dataIdx < data.length; dataIdx++) {
                let poverty29data = data[dataIdx];
                let xyData = this.convertToXY(poverty29data);
                xyData['idx'] = dataIdx;
                chartData.push(xyData);
            }
            let gdpData = chartData.pop();
            this.createLineChart(chartData, gdpData);
        });
    }

    initData() {
        let worldDataUrl = process.env.PUBLIC_URL + '/data/world_poverty.csv';

        return d3.csv(worldDataUrl).then(data => {
            return data;
        });
    }

    createLineChart(data, gdpData) {
        let lineChartSvg = d3.select(`#${this.state.id}`);
        lineChartSvg.style('height', '50vh')
            .style('width', '45vw');

        let svgRect = lineChartSvg.node().getBoundingClientRect();

        let chartMargin = { left: 35, right: 60, top: 100, bottom: 25 }
        let legendMargin = { top: 25, right: 60 }
        let chartWidth = svgRect.width - chartMargin.left - chartMargin.right;
        let chartHeight = svgRect.height - chartMargin.top - chartMargin.bottom;

        let shapes = [
            d3.symbolCross,
            d3.symbolDiamond,
            d3.symbolSquare,
            d3.symbolStar,
            d3.symbolTriangle,
            d3.symbolWye,
            d3.symbolCircle,
        ];

        let timeParser = d3.timeParse('%Y');

        let xScale = d3.scaleTime()
            .domain(d3.extent(data[0].x).map(d => timeParser(d)))
            .range([chartMargin.left, chartWidth + chartMargin.left]);

        lineChartSvg.append("g")
            .attr("transform", `translate(0, ${chartHeight + chartMargin.top})`)
            .call(d3.axisBottom(xScale))
            .style('font-weight', 'bold');

        let yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([chartHeight + chartMargin.top, chartMargin.top]);

        lineChartSvg.append("g")
            .call(d3.axisLeft(yScale))
            .attr('transform', `translate(${chartMargin.left}, 0)`)
            .style('font-weight', 'bold');

        let topContainer = lineChartSvg.append('g');

        let chartContainers = topContainer
            .selectAll('g')
            .data(data)
            .enter()
            .append('g');

        let symbolGenerator = d3.symbol().size(50);
        chartContainers
            .append('path')
            .datum(d => _.zip(d.x, d.y).filter(d => d[1] > 0))
            .attr('fill', 'none')
            .attr('stroke', function (d, i) {
                let parentData = d3.select(this.parentNode).datum();
                return parentData.type === 'poverty' ? 'grey' : d3.schemeTableau10[i];
            })
            .attr('stroke-width', '3')
            .attr('d', d3.line()
                .x((d) => xScale(timeParser(d[0])))
                .y(d => yScale(d[1]))
            );
        chartContainers
            .selectAll('path')
            .data(d => _.zip(d.x, d.y).filter(d => d[1] > 0))
            .enter()
            .append('path')
            .attr('d', function (d, i) {
                let parentData = d3.select(this.parentNode).datum();
                return symbolGenerator.type(shapes[parentData['idx']])();
            })
            .attr('transform', (d) => `translate(${xScale(timeParser(d[0]))}, ${yScale(d[1])})`)
            .attr('fill', function (d, i) {
                let parentData = d3.select(this.parentNode).datum();
                return parentData.type === 'poverty' ? 'grey' : d3.schemeTableau10[parentData['idx']];
            })
            .style('stroke', '#656176');



        // The gdpdata
        yScale = d3.scaleLinear()
            .domain(d3.extent(gdpData.y))
            .range([chartHeight + chartMargin.top, chartMargin.top]);

        lineChartSvg.append("g")
            .call(d3.axisRight(yScale))
            .attr('transform', `translate(${chartWidth + chartMargin.left}, 0)`)
            .style('font-weight', 'bold');

        let gdpContainer = topContainer.append('g').datum(gdpData);
        gdpContainer
            .append('path')
            .datum(d => _.zip(d.x, d.y).filter(d => d[1] > 0))
            .attr('fill', 'none')
            .attr('stroke', function (d, i) {
                let parentData = d3.select(this.parentNode).datum();
                return parentData.type === 'poverty' ? 'grey' : d3.schemeTableau10[parentData['idx']];
            })
            .attr('stroke-width', '3')
            .attr('d', d3.line()
                .x((d) => xScale(timeParser(d[0])))
                .y(d => yScale(d[1]))
            );
        gdpContainer
            .selectAll('circle')
            .data(d => _.zip(d.x, d.y).filter(d => d[1] > 0))
            .enter()
            .append('circle')
            .attr('cx', d => xScale(timeParser(d[0])))
            .attr('cy', d => yScale(d[1]))
            .attr('r', 5)
            .attr('fill', function (d, i) {
                let parentData = d3.select(this.parentNode).datum();
                return parentData.type === 'poverty' ? 'grey' : d3.schemeTableau10[parentData['idx']];
            })
            .style('stroke', '#656176');

        chartContainers = topContainer.selectAll('g');

        chartContainers
            .append('path')
            .attr('d', function (d, i) {
                let parentData = d3.select(this.parentNode).datum();
                return symbolGenerator.type(shapes[parentData['idx']])();
            })
            .attr('transform', (d, i) => `translate(${chartWidth - 350}, ${legendMargin.top + i * 13})`)
            .attr('fill', (d, i) => d.type === 'poverty' ? 'grey' : d3.schemeTableau10[i]);

        chartContainers
            .append('text')
            .attr('x', chartWidth - 340)
            .attr('y', (d, i) => legendMargin.top + i * 13 + 3)
            .text((d, i) => d.description)
            .attr('fill', (d, i) => d.type === 'poverty' ? 'grey' : d3.schemeTableau10[i])
            .style("font-size", "11px");


        return topContainer;
    }

    render() {
        return (
            <div className="line-chart">
                <svg id={this.state.id}></svg>
            </div>
        );
    }
}

export default LineChart;