import { Annotation } from './superpixel';
import data from "./test.jpg.json";
import './App.css';
import './imageOverlay.css';
import { CanvasSuperpixel } from './canvasSuperpixel';
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

const annotatedList: Annotation[] = [ new Annotation(1,colors[1], 1), new Annotation(2,colors[2], 2) ];

function App() {
  return (
    <div className="App">
      <CanvasSuperpixel keyId={"mainCanvas"} fileName={"./resource/test.jpg"} segmentationData={data} annotationData={annotatedList} width={1024} height={768} defaultcolor={"black"} colorbuttons={colors}/> 
    </div>
  );
}

export default App;
