import { FETCH_POVERTY_DATA, GET_POVERTY_DATA } from "../actions/types";

const initialState = {
    povertyData: {
        povertyData: [],
        dataYears: [],
        projects: []
    },
    educationData: [],
    employmentData: []
};

const povertdataReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_POVERTY_DATA:

            return {
                ...state,
                povertyData: action.payload.povertyData,
                educationData: action.payload.educationData,
                employmentData: action.payload.employmentData
            };
        case GET_POVERTY_DATA:
            return state;
        default:
            return state;
    }
}

export default povertdataReducer;