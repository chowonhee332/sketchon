import React from 'react';
import ContentsBuilder from './ContentsBuilder';

const CreonSidebar = ({ onClose }) => {
    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Close button layered on top if needed, but ContentsBuilder has its own close buttons potentially? 
                Actually the ContentsBuilder has "Back to Home" but not "Close Sidebar".
                Let's add a small absolute close button for the sidebar itself just in case.
            */}
            <ContentsBuilder />
        </div>
    );
};

export default CreonSidebar;


