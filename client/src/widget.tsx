import React, {useState} from "react";

const bottomRight = 10;
const widgetSize = 50;
const boxShadow = "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)";

export const Widget = () => {

    const [isExpanded, setIsExpanded] = useState<boolean>();

    return (
        <>
            <div
                style={{
                    position: "fixed",
                    zIndex: 99999,
                    bottom: `${bottomRight}px`,
                    right: `${bottomRight}px`,
                    width: `${widgetSize}px`,
                    height: `${widgetSize}px`,
                    borderRadius: `${widgetSize/2}px`,
                    cursor: "pointer",
                    background: "orange",
                    boxShadow
                }}
                onClick={() => setIsExpanded(previous => !previous)}
            >
                <div style={{
                    position: "absolute",
                    fontSize: `${widgetSize/2}px`,
                    top: `${widgetSize/4}px`,
                    left: `${widgetSize/4}px`,
                    userSelect: "none"
                }}>
                    📌
                </div>
            </div>
            {isExpanded && (
                <div style={{
                    position: "fixed",
                    zIndex: 99998,
                    background: "white",
                    boxShadow,
                    border: "2px orange solid",
                    padding: "5px",
                    width: "250px",
                    height: "calc(100vh - 100px)",
                    bottom: `${bottomRight + (widgetSize/2) - 5}px`,
                    right: `${bottomRight + (widgetSize/2) - 5}px`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                }}>
                    Assets & messages will appear here
                    <div style={{
                        display: "flex"
                    }}>
                        <textarea style={{flexGrow: 1, marginRight: "5px"}} placeholder="enter chat message here..." rows={2}/>
                        <button className="btn">Send</button>
                    </div>
                </div>
            )}
        </>
    )
}
