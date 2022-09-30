import { RefObject, useEffect, useState } from "react";
import { Map, View } from "ol";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { OSM, Vector as VectorSource } from "ol/source";
import { fromLonLat } from "ol/proj";
import { defaults, FullScreen, ScaleLine } from "ol/control";
import { GeoJSON } from "ol/format";
import { Draw, Snap } from "ol/interaction";
import { Type } from "ol/geom/Geometry";
import { BaseLayerOptions } from "ol-layerswitcher";
import LayerSwitcher from "ol-layerswitcher";

export const useMap = (mapRef: RefObject<HTMLElement>, type: string) => {
  const [map, setMap] = useState<Map | null>(null);
  const [draw, setDraw] = useState<Draw | null>(null);
  const [snap, setSnap] = useState<Snap | null>(null);

  useEffect(() => {
    if (mapRef.current) {
      const baseMap = new TileLayer({
        title: "Base Map",
        type: "base",
        source: new OSM()
      } as BaseLayerOptions);

      const masterMap = new VectorLayer({
        title: "Master Map",
        source: new VectorSource({
          url: "https://www.planning.data.gov.uk/entity/44001294.geojson",
          format: new GeoJSON()
        }),
        style: {
          "stroke-color": "hsl(0 0% 0%)",
          "stroke-width": 2,
          "fill-color": "hsl(0 0% 0% / 0.1)"
        }
      } as BaseLayerOptions);

      const editMap = new VectorLayer({
        title: "Edit Map",
        source: new VectorSource(),
        style: {
          "fill-color": "rgba(255, 0, 0, 0.3)",
          "stroke-color": "rgba(255, 0, 0, 0.9)",
          "stroke-width": 2
        }
      } as BaseLayerOptions);

      const layerSwitcher = new LayerSwitcher({
        groupSelectStyle: "children"
      });

      const fullScreen = new FullScreen();
      const scaleLine = new ScaleLine();

      const snap = new Snap({
        source: masterMap.getSource()!
      });
      setSnap(snap);

      const draw = new Draw({
        type: type as Type,
        source: editMap.getSource()!,
        trace: true,
        traceSource: masterMap.getSource()!,
        style: {
          "stroke-color": "rgba(100, 255, 0, 1)",
          "stroke-width": 2,
          "fill-color": "rgba(100, 255, 0, 0.3)",
          "circle-radius": 6,
          "circle-fill-color": "rgba(100, 255, 0, 1)"
        }
      });
      setDraw(draw);

      const map = new Map({
        target: mapRef.current,
        layers: [baseMap, masterMap, editMap],
        controls: defaults().extend([layerSwitcher, fullScreen, scaleLine]),
        view: new View({
          center: fromLonLat([-2.4673, 52.6776]),
          zoom: 13
        })
      });
      setMap(map);

      return () => map.dispose();
    }
  }, []);

  return { map, draw, snap };
};
