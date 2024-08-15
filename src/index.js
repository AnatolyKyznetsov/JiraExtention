import * as css from './style.css';
import { awaitTimer } from './modules/awaitTimer.js'; 
import { JiraExtention } from './components/JiraExtention.js'; 

awaitTimer(
    () => document.readyState === 'complete', 
    () => { 
        if (location.pathname.match('OIPPMF')) {
            new JiraExtention();
        } else if (location.pathname.match('OIP')) {
            console.log('OIP');
        }
    }
);
