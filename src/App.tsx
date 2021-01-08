import { useEffect, useState } from "react";
import data from "./20200924_094945.jpg.json";
import loadedAnnotatedData from "./annotatedData.json";
import './App.css';
import './imageOverlay.css';
import { importAnnotatedData } from "./superpixel-canvas/canvasAnnotator";
import { Annotation, clearCanvas, exportToPng, getSvgUrl,  IAnnotation,  SuperpixelCanvas, updateAnnotating } from "./superpixel-canvas/superpixelCanvas";
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

const canvasId = "mainCanvas";
const svgDownBtnId = "svgDownload";
const imgFileName = "./resource/20200924_094945.jpg";
const svgFileName = "./resource/20200924_094945.jpg.svg";
const defaultColor = "black";
const canvasWidth = 1024;
const canvasHeight = 768;
const annotatedList: Annotation[] = importAnnotatedData(loadedAnnotatedData);
//[ {tag: "1", color: "#5db300", index: 1}, {tag: "2", color: "#e81123", index: 2}];

const downloadAnnotatedSvg = () => { document.getElementById(svgDownBtnId)?.setAttribute("href", getSvgUrl(canvasId)); document.getElementById(svgDownBtnId)?.click(); }
const downloadEmptySvg = () => { document.getElementById(svgDownBtnId)?.setAttribute("href", getSvgUrl(canvasId, true)); document.getElementById(svgDownBtnId)?.click(); }

function App() {
  const [ gridOn, setGridOn ] = useState(false);
  
  useEffect( () => {} , [gridOn]);

  return (
    <div className="App">
      <div className="coloring-buttons">
        {colors.map((color: string, tag:number) => (
          <button
            key={tag}
            name={tag.toString()}
            style={{backgroundColor: color}}
            onClick={() => updateAnnotating(canvasId, tag === 0 ? "deannotating" : tag.toString(), tag === 0 ? defaultColor : color)}
          >
            {tag === 0 ? 'remove' : tag}
          </button>
        ))}
      </div>
      <div className="img-overlay-wrap">
        <img src={imgFileName} width={canvasWidth} height={canvasHeight} alt={"sample"}/>
        <SuperpixelCanvas id={canvasId} segmentationData={data} svgName={svgFileName} annotatedData={annotatedList} 
            canvasWidth={canvasWidth} canvasHeight={canvasHeight} defaultColor={defaultColor} gridOn={gridOn}
            onSegmentsUpdated={(data) => {}} onSelectedTagUpdated={(data) => {}} onCanvasLoaded={() => console.log("Canvas loaded!")} />
      </div>
      <div>
        <input type={"checkbox"} onChange={(e) => setGridOn(e.target.checked)}/>turn on grid<br />
        <button onClick={() => clearCanvas(canvasId, "black")}>clear canvas</button><br />
        <button onClick={() => exportToPng(canvasId, "test", "black")}>annotated PNG download</button><br/>
        <button type="submit" onClick={downloadAnnotatedSvg}>annotated SVG download</button>
        <button type="submit" onClick={downloadEmptySvg}>empty SVG download</button>
        <a id={svgDownBtnId} download={imgFileName.split("/")[imgFileName.split("/").length - 1]+".svg"} href-lang='image/svg+xml' href={"#"} hidden>download link</a>
      </div>
    </div>
    );
}

export default App;