import data from "./20200924_094945.jpg.json";
import './App.css';
import './imageOverlay.css';
import { Annotation, exportToPng, getSvgUrl,  SuperpixelCanvas, updateAnnotating } from "./superpixelCanvas";
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

const annotatedList: Annotation[] = [ {tag: "1", color: "#5db300", index: 1}, {tag: "2", color: "#e81123", index: 2}];
const canvasId = "mainCanvas";
const svgDownBtnId = "svgDownload";
const imgFileName = "./resource/20200924_094945.jpg";
const defaultColor = "black";
const canvasWidth = 1024;
const canvasHeight = 768;

function App() {

  return (
    <div className="App">
      <div className="coloring-buttons">
        {colors.map((color: string, tag:number) => (
          <button
            key={tag}
            name={tag.toString()}
            onClick={() => updateAnnotating(canvasId, tag === 0 ? "deannotating" : tag.toString(), tag === 0 ? defaultColor : color)}
          >
            {color}
          </button>
        ))}
      </div>
      <div className="img-overlay-wrap" onMouseUp={() => document.getElementById(svgDownBtnId)?.setAttribute("href", getSvgUrl(canvasId))}>
        <img src={imgFileName} width={canvasWidth} height={canvasHeight} alt={"sample"}/>
        <SuperpixelCanvas id={canvasId} segmentationData={data} annotatedData={annotatedList} 
            canvasWidth={canvasWidth} canvasHeight={canvasHeight} defaultColor={defaultColor} 
            onSegmentsUpdated={(data) => {}} onSelectedTagUpdated={(data) => {}} onCanvasLoaded={() => console.log("Canvas loaded!")} />
      </div>
      <div>
        <a href="#" onClick={() => exportToPng(canvasId, "test", "black")}>PNG download</a><br/>
        <a id={svgDownBtnId} download={imgFileName.split("/")[imgFileName.split("/").length - 1]+".svg"} href-lang='image/svg+xml' href={getSvgUrl(canvasId)}>SVG download</a>
      </div>
    </div>
    );
}

export default App;