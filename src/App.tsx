import data from "./test.jpg.json";
import './App.css';
import './imageOverlay.css';
import { Annotation, exportToPng,  exportToSvg,  getSvgUrl,  SuperpixelCanvas } from "./superpixelCanvas";
import { useEffect, useState } from "react";
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
const svgDownBtnId = "svgDownload";
const imgFileName = "./resource/test.jpg";
const defaultColor = "black";
const canvasWidth = 1024;
const canvasHeight = 768;

const updateAnnotating = (tag: string, color:string, setAnnotating: (anno: Annotation) => void) => {
  document.getElementById(canvasId)?.setAttribute("name", color);
  document.getElementById(canvasId)?.setAttribute("color-profile", tag);
  setAnnotating(new Annotation(tag, color));
}

function App() {
  const [annotating, setAnnotating] = useState(new Annotation("deannotating", defaultColor));
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect( () => {
    if (document.getElementById(canvasId)){
      setCanvasReady(true);
    }
  });

  return (
    <div className="App">
    <div className="coloring-buttons">
      {colors.map((color: string, tag:number) => (
        <button
          key={tag}
          name={tag.toString()}
          onClick={() => updateAnnotating(tag === 0 ? "deannotating" : tag.toString(), tag === 0 ? defaultColor : color, setAnnotating)}
        >
          {color}
        </button>
      ))}
    </div>
    <div className="img-overlay-wrap" onMouseUp={() => document.getElementById(svgDownBtnId)?.setAttribute("href", getSvgUrl(canvasId))}>
      <img src={imgFileName} width={canvasWidth} height={canvasHeight} alt={"sample"}/>
      <SuperpixelCanvas id={canvasId} segmentationData={data} annotatedData={annotatedList} 
          canvasWidth={canvasWidth} canvasHeight={canvasHeight} defaultcolor={defaultColor} 
          annotating={annotating} onSegmentsUpdated={(data) => {}} onSelectedTagUpdated={(data) => {}}/>
    </div>
    <div>{
      canvasReady && (<div>
        <a href="#" onClick={() => exportToPng(canvasId, "test", "black")}>PNG download</a><br/>
        <a id={svgDownBtnId} download={imgFileName.split("/")[imgFileName.split("/").length - 1]+".svg"} href-lang='image/svg+xml' href={getSvgUrl(canvasId)}>SVG download</a>
      </div>)}
    </div>
    </div>
    );
}

export default App;