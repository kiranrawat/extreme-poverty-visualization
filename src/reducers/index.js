import { combineReducers } from 'redux';

import povertydataReducer from './povertydata';

export default combineReducers({
    povertydata: povertydataReducer
});