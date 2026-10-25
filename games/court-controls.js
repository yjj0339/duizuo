import {contact} from './racket-rules.js';
export const needsLandscape=()=>false;
export function simpleBadmintonShot(v,p){if(!v)return null;if(v.rally&&contact('badminton',v,p,v.now,'smash').ready)return'smash';return contact('badminton',v,p,v.now,'clear').ready?'clear':null;}
