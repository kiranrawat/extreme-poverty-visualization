import React, { useState, useEffect, useRef } from "react";
import './bank-projects.css';
import { useSelector, useDispatch } from "react-redux";
import * as d3 from "d3";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


export default function BankProjectsChart() {

    let data = {};
    let leafletChart = {}
    const mapRef = useRef();

    const mapStyle = function (feature) {
        const colorScale = d3.scaleLinear()
            .domain(data.projectsDomain)
            .range([0, 1]);

        const projectCount = data.projectsData[feature.id] && data.projectsData[feature.id]['projects'];
        return {
            fillColor: d3.interpolateRdYlGn(colorScale(projectCount)) || 'blue', //getColor(feature.properties.density),
            // weight: 2,
            // opacity: 1,
            // color: 'white',
            // dashArray: '3',
            fillOpacity: 0.7
        };
    }

    function highlightFeature(e) {
        var layer = e.target;

        layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    }

    function resetHighlight(e) {
        leafletChart.geoJsonLayer.resetStyle(e.target);
    }

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
        });
    }

    const printMap = () => {
        leafletChart.map = L.map(mapRef.current).setView([51.505, -0.09], 2);

        // L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        //     maxZoom: 18,
        //     attribution: '',
        //     id: 'mapbox/light-v9',
        //     // id: 'mapbox/streets-v11',
        //     tileSize: 512,
        //     zoomOffset: -1,
        //     noWrap: true
        // }).addTo(leafletChart.map);

        leafletChart.geoJsonLayer = L.geoJson(data.geoJsonData, { style: mapStyle, onEachFeature: onEachFeature });
        leafletChart.geoJsonLayer.addTo(leafletChart.map);
    }

    const fetchData = async () => {
        // const meanPovertyDataUrl = process.env.PUBLIC_URL + '/data/meanpoverty.csv';
        // const projectsDataUrl = process.env.PUBLIC_URL + '/data/projects_data.csv';
        let geoDataUrl = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';
        const projectsDataUrl = process.env.PUBLIC_URL + '/data/country_projects.json';

        //fetch the data
        let geoJsonData = await fetch(geoDataUrl);
        const projectsData = await d3.json(projectsDataUrl);
        // const meanpovertyData = await d3.csv(meanPovertyDataUrl);
        // const projectsData = await d3.csv(projectsDataUrl);
        geoJsonData = await geoJsonData.json();

        const projs = Object.values(projectsData).map(a => a.projects);
        projs.pop();
        const projectsDomain = d3.extent(projs);
        data = { projectsData, geoJsonData, projectsDomain }; //{ geoJsonData, meanpovertyData, projectsData };

        printMap();
    }

    fetchData();
    return (
        <div className="bank-projects">
            <div>
                <div className="map-container" ref={mapRef}></div>
            </div>
            <div className="correlation-charts">
                <div>
                    <svg></svg>
                </div>
                <div>
                    <svg></svg>
                </div>
            </div>
        </div>
    );
}