import React, { useState, useEffect, useRef } from "react";
import './range-chart.css';
import { useSelector, useDispatch } from "react-redux";
import * as d3 from "d3";
import { fetchData } from "../../actions/povertydataActions";


export default function RangeChart() {
    const [state, setState] = useState(() => ({
        project: "SI.POV.LMIC.GP",
        yearIdx: -1,
        projectText: '',
        hoverCountry: ''
    }));
    const svgRef = useRef();
    const schoolRef = useRef();
    const employmentRef = useRef();

    const povertyTooltipRef = useRef();
    const schoolTooltipRef = useRef();
    const employmentTooltipRef = useRef();


    const data = useSelector(state => state.povertydata);
    const { projects, dataYears, povertyData } = data.povertyData;
    const { educationData, employmentData } = data;
    const dispatch = useDispatch();

    const filterPovertyData = () => {
        const project = state.project === "" ? projects[0].value : state.project;
        const selectedYear = dataYears[state.yearIdx];
        const chartData = povertyData.reduce((result, d) => {
            if (d["Indicator Code"] === project && d[selectedYear] !== "") {
                result.push({
                    country: d['Country Name'],
                    pov: d[selectedYear],
                });
            }
            return result;
        }, []);
        chartData.sort((a, b) => +a['pov'] < +b['pov']);
        return chartData;
    }

    const selectionEvent = (hoverCountry) => {
        const tooltips = [schoolTooltipRef.current, employmentTooltipRef.current, povertyTooltipRef.current];
        const allSvgs = [schoolRef.current, employmentRef.current, svgRef.current];
        if (hoverCountry === '') {
            d3.selectAll(tooltips).style('display', 'none');
            d3.selectAll(allSvgs)
                .selectAll('circle')
                .attr('stroke', 'none')
                .attr('stroke-width', '0');
        } else {
            const points = d3.selectAll(allSvgs)
                .selectAll('circle')
                .filter(d => d['country'] === hoverCountry);

            points
                .attr('stroke', 'black')
                .attr('stroke-width', '2');

            const bodyRect = document.body.getBoundingClientRect();

            points.nodes().forEach((point, idx) => {
                const pointRect = point.getBoundingClientRect();
                const data = point.__data__;
                let tooltipText = `Country: ${data['country']}<hr />`;
                tooltipText += `<span>Pov: ${(+data['pov']).toFixed(2)}%</span>`
                if (data['corr'])
                    tooltipText += `<br><span>X: ${(+data['corr']).toFixed(2)}%</span>`
                const tooltip = d3.select(tooltips[idx])
                    .html(tooltipText)
                    .style("display", "block");

                let tooltipRect = tooltip.node().getBoundingClientRect();

                tooltip
                    .style("left", pointRect.left + 10 + "px")
                    .style("top", pointRect.top - bodyRect.top - tooltipRect.height - 5 + "px")
            });

        }

    }

    const printChart = (chartData) => {

        const d3svg = d3.select(svgRef.current);
        const tooltip = d3.select(povertyTooltipRef.current);
        // const selectedYear = dataYears[state.yearIdx];
        const selectedYear = 'pov';

        d3svg.selectAll("*").remove();
        const svgRect = d3svg.node().getBoundingClientRect();

        const chartMargin = { left: 10, top: 10, right: 20, bottom: 150 };
        let yScale = d3
            .scaleLinear()
            .domain([0, 100])
            .range([
                svgRect.height - chartMargin.top - chartMargin.bottom,
                chartMargin.top
            ]);

        let yAxis = d3.axisLeft().scale(yScale);
        let yAxisContainer = d3svg.append("g").call(yAxis);
        let yAxisRect = yAxisContainer.node().getBoundingClientRect();
        yAxisContainer.attr(
            "transform",
            `translate(${chartMargin.left + yAxisRect.width}, 0)`
        );

        let xScale = d3
            .scalePoint()
            .domain(chartData.map(d => d['country']))
            .range([
                chartMargin.left,
                svgRect.width - chartMargin.left - chartMargin.right
            ])
            .padding(0.6);
        // .round(true);

        let xAxis = d3.axisBottom().scale(xScale);
        let xAxisContainer = d3svg.append("g").call(xAxis);
        xAxisContainer.attr(
            "transform",
            `translate(${chartMargin.left + yAxisRect.width}, ${yScale(0)})`
        );
        xAxisContainer
            .selectAll("text")
            .attr("y", 0)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("transform", "rotate(90)")
            .style("text-anchor", "start")
            .style("font-size", "12pt");

        let lableContainers = d3svg
            .append("g")
            .attr("transform", `translate(${chartMargin.left + yAxisRect.width}, 0)`)
            .selectAll("g")
            .data(chartData)
            .enter()
            .append("g")
            .on("mousemove", function (d, i) {
                // let element = d3.select(this);
                // element.selectAll("circle, rect").attr("fill", "#e65f5c");
                // let coords = d3.mouse(document.body);
                // let rect = this.getBoundingClientRect();
                // tooltip
                //     .html(
                //         `Country: ${d['country']} <br><hr> <span class="percent">${(+d[
                //             selectedYear
                //         ]).toFixed(2)}%</span>`
                //     )
                //     .style("display", "block")
                //     .style("left", coords[0] + 5 + "px")
                //     .style("top", coords[1] + 5 + "px");
                selectionEvent(d['country']);
            })
            .on("mouseout", function (d, i) {
                // d3.select(this)
                //     .selectAll("circle, rect")
                //     .attr("fill", d3.interpolateRdYlGn((100 - d[selectedYear]) / 100));
                // tooltip.style("display", "none");
                selectionEvent('');
            });

        lableContainers
            .append("circle")
            .attr("cx", (d, i) => xScale(d['country']))
            .attr("cy", d => yScale(d[selectedYear]))
            .attr("r", 5)
            .attr("fill", d => d3.interpolateRdYlGn((100 - d[selectedYear]) / 100));

        lableContainers
            .append("rect")
            .attr("x", d => xScale(d['country']))
            .attr("y", d => yScale(d[selectedYear]))
            .attr("width", 2)
            .attr("height", d => yScale(0) - yScale(+d[selectedYear]))
            .attr("fill", d => d3.interpolateRdYlGn((100 - d[selectedYear]) / 100));
    };

    const printCorrelations = (povertyChartData, corrData, containerRef, xLabel) => {
        const selectedYear = dataYears[state.yearIdx];
        let corrDataSet = {};

        corrData = corrData.filter(d => d[selectedYear] !== '').forEach(d => {
            corrDataSet[d['Country Name']] = d[selectedYear];
        });
        const chartData = povertyChartData.reduce((result, d) => {
            const pov = d['pov'];
            const corr = corrDataSet[d['country']];
            if (pov && corr) {
                result.push({
                    country: d['country'],
                    pov,
                    corr: corrDataSet[d['country']]
                });
            }
            return result;
        }, []);



        const svg = d3.select(containerRef.current);
        svg.selectAll('*').remove();
        const svgRect = containerRef.current.getBoundingClientRect();
        const svgMargin = {
            top: 30,
            bottom: 50,
            left: 50,
            right: 30
        };

        const yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([svgRect.height - svgMargin.bottom, svgMargin.top]);

        let yAxis = d3.axisLeft().scale(yScale);
        let yAxisContainer = svg.append("g").call(yAxis);
        let yAxisRect = yAxisContainer.node().getBoundingClientRect();
        yAxisContainer.attr(
            "transform",
            `translate(${svgMargin.left + yAxisRect.width}, 0)`
        );


        let extentCorr = d3.extent(chartData.map(d => +d['corr']));
        const xScale = d3.scaleLinear()
            .domain(extentCorr[1] > 100 ? [0, extentCorr[1]] : [0, 100])
            .range([svgMargin.left + yAxisRect.width, svgRect.width - svgMargin.right]);
        let xAxis = d3.axisBottom().scale(xScale);
        let xAxisContainer = svg.append("g").call(xAxis);
        let xAxisRect = xAxisContainer.node().getBoundingClientRect();
        xAxisContainer.attr(
            "transform",
            `translate(0, ${svgRect.height - svgMargin.bottom})`
        );

        let yLabelElement = svg.append('text')
            .attr('x', svgMargin.left - 10)
            .attr('y', (svgRect.height - svgMargin.bottom) / 2)
            .style('font-weight', 'bold')
            .text(state.projectText);
        let yLabelElementRect = yLabelElement.node().getBoundingClientRect();
        yLabelElement.attr('transform', `rotate(-90, ${svgMargin.left}, ${(svgRect.height - svgMargin.bottom) / 2}) translate(${-(svgRect.height / 2) + 30}, 0)`)

        svg.append('text')
            .attr('x', svgRect.width / 2 - 30)
            .attr('y', svgRect.height - svgMargin.bottom + 40)
            .style('font-weight', 'bold')
            .text(xLabel);

        svg.append('g')
            .selectAll('circle')
            .data(chartData)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d['corr']))
            .attr('cy', d => yScale(d['pov']))
            .attr('r', 5)
            .attr("fill", d => d3.interpolateRdYlGn((100 - d['pov']) / 100))
            .on('mousemove', d => selectionEvent(d['country']))
            .on('mouseout', d => selectionEvent(''));
    }

    const projectChanged = event => {
        setState({ ...state, project: event.currentTarget.value, projectText: event.currentTarget.selectedOptions[0].text });
    };

    const yearChanged = event => {
        setState({ ...state, yearIdx: event.currentTarget.value });
    };

    useEffect(() => {
        d3.select(svgRef.current)
            .style("height", "40vh")
            .style("width", "100%");
        dispatch(fetchData());
    }, []);

    useEffect(() => {
        if (!projects.length) return;
        state.project = projects[1].value;
        state.projectText = projects[1].text;
        state.yearIdx = dataYears.length - 2;
    }, [projects, dataYears]);

    useEffect(() => {
        if (!dataYears.length || !povertyData.length) return;
        const chartData = filterPovertyData();
        printChart(chartData);
        printCorrelations(chartData, educationData, schoolRef, 'School Enrollment');
        printCorrelations(chartData, employmentData, employmentRef, 'Empolyment');
    }, [state, dataYears, povertyData]);

    return (
        <div className="range-chart">
            <div className="inputs">
                <div>
                    {projects.length && (
                        <select defaultValue={projects[1].value} onChange={projectChanged}>
                            {projects.map((project, index) => (
                                <option key={index} value={project.value}>
                                    {project.text}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                {dataYears.length && (<div>

                    <input
                        step="1"
                        min="0"
                        max={dataYears.length - 2}
                        defaultValue={dataYears.length - 2}
                        type="range"
                        onChange={yearChanged}
                    />
                    <div>Year: {state.yearIdx > -1 ? dataYears[state.yearIdx] : dataYears[dataYears.length - 2]}</div>
                </div>
                )}
            </div>

            <div>
                <svg ref={svgRef}></svg>
            </div>
            <div className="correlations">
                <div>
                    <svg ref={schoolRef}></svg>
                </div>
                <div>
                    <svg ref={employmentRef}></svg>
                </div>
            </div>
            <div ref={povertyTooltipRef} className="tootltip"></div>
            <div ref={schoolTooltipRef} className="tootltip"></div>
            <div ref={employmentTooltipRef} className="tootltip"></div>

        </div>
    );
}
