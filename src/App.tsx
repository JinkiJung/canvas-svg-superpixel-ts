import data from "./test.jpg.json";
import './App.css';
import './imageOverlay.css';
import { Annotation, exportToPng,  exportToSvg,  SuperpixelCanvas } from "./superpixelCanvas";
import { useState } from "react";
const React = require('react');


const colors = ["remove", "#5db300", 
"#e81123", 
"#6917aa", 
"#015cda",
"#4894fe", 
"#6b849c",
"#70c400", 
"#f7929a", 
"#257ffe", ];

const annotatedList: Annotation[] = [ ];
const canvasId = "mainCanvas";

const updateAnnotating = (tag: string, color:string, setAnnotating: (anno: Annotation) => void) => {
  document.getElementById(canvasId)?.setAttribute("name", tag.toString());
  document.getElementById(canvasId)?.setAttribute("color-profile", color);
  setAnnotating(new Annotation(tag, color));
}

function App() {
  const [annotating, setAnnotating] = useState(new Annotation("test", colors[1]));

  return (
    <div className="App">
    <div className="coloring-buttons">
      {colors.map((color: string, tag:number) => (
        <button
          key={tag}
          onClick={() => updateAnnotating(tag.toString(), color, setAnnotating)}
        >
          {color}
        </button>
      ))}
    </div>
    <div className="img-overlay-wrap">
      <img src="./resource/test.jpg" alt={"sample"}/>
      <SuperpixelCanvas id={canvasId} segmentationData={data} annotatedData={annotatedList} 
          canvasWidth={1024} canvasHeight={768} defaultcolor={"black"} 
          annotating={annotating} onSegmentsUpdated={(data) => {}} onSelectedTagUpdated={(data) => {}}/>
    </div>
    <div>
      <button className="export-button" onClick={() => exportToPng(canvasId, "test", "black")}>export to PNG</button>
      <button className="export-button" onClick={() => exportToSvg(canvasId, "test")}>export to SVG</button>
    </div>
    </div>
    );
}

export default App;