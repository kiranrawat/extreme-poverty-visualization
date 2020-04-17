import * as d3 from 'd3';
import { FETCH_POVERTY_DATA } from './types';

const projects = [
    { value: "SI.POV.GAPS", text: 'People % below $1.90/day' },
    { value: "SI.POV.LMIC.GP", text: 'People % below $3.20/day' },
    { value: "SI.POV.UMIC.GP", text: 'People % below $5.50/day' },
    { value: "EN.POP.SLUM.UR.ZS", text: 'People % living in slums' },
];
const povertyDataUrl = process.env.PUBLIC_URL + '/data/poverty_1.9.csv';
const educationDataUrl = process.env.PUBLIC_URL + '/data/school_enroll.csv';
const employmentDataUrl = process.env.PUBLIC_URL + '/data/employment.csv';

export const fetchData = () => (dispatch) => {
    const povertyPromise = d3.csv(povertyDataUrl).then(data => {
        let projectIndicators = projects.map(d => d.value);
        let povertyData = data.filter(d => projectIndicators.indexOf(d['Indicator Code']) > -1);
        let dataYears = Object.keys(povertyData[0]).map(d => +d).filter(d => d > 0);
        return { povertyData, dataYears, projects };
    });
    Promise.all([povertyPromise, d3.csv(educationDataUrl), d3.csv(employmentDataUrl)])
        .then(([povertyData, educationData, employmentData]) => {
            dispatch({ type: FETCH_POVERTY_DATA, payload: { povertyData, educationData, employmentData } });
        })

}