import React from "react";
import { THEME } from "../../theme";

function DetailsWelcomeMessage({ pageName }) {
    return (
        <div>
            <h1 style={{ fontSize: 22, color: THEME.colors.navy, margin: 0 }}>
                Details
            </h1>
            <p style={{ color: "#666", marginBottom: 15 }}>
                Here’s a snapshot of {pageName.toLowerCase()} activity.
            </p>
        </div>
    );
}

export default DetailsWelcomeMessage;