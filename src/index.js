import * as css from './style.css';
import { awaitTimer } from './modules/awaitTimer.js'; 
import { JiraExtentionOIP } from './components/JiraExtentionOIP.js'; 
import { JiraExtentionOIPPMF } from './components/JiraExtentionOIPPMF.js'; 

awaitTimer(
    () => document.readyState === 'complete', 
    () => { 
        if (location.pathname.match('OIPPMF')) {
            new JiraExtentionOIPPMF();
        } else if (location.pathname.match('OIP')) {
            new JiraExtentionOIP();
        }
    }
);
