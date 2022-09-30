import { useRef, useState } from "react";
import { useMap } from "./map";

export default function App() {
  const mapRef = useRef(null);
  const [type, setType] = useState("MultiPolygon");
  const { map, draw, snap } = useMap(mapRef, type);

  const startDrawing = () => {
    if (draw && snap) {
      map?.addInteraction(draw);
      map?.addInteraction(snap);
    }
  };

  const stopDrawing = () => {
    if (draw && snap) {
      map?.removeInteraction(draw);
      map?.removeInteraction(snap);
    }
  };

  return (
    <main>
      <h1>Map example</h1>
      <div ref={mapRef} className='map'></div>
      <section>
        <select onChange={e => setType(e.target.value)}>
          <option value='MultiPolygon'>MultiPolygon</option>
          <option value='Polygon'>Polygon</option>
          <option value='Circle'>Circle</option>
          <option value='Point'>Point</option>
        </select>
        <button onClick={startDrawing}>Start Drawing</button>
        <button onClick={stopDrawing}>Stop Drawing</button>
        <button onClick={() => draw?.removeLastPoint()}>Undo</button>
      </section>
    </main>
  );
}
