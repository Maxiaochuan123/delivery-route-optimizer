export interface MarkerOptions {
  position: [number, number]; // [lng, lat]
  title?: string;
  content?: string;
  icon?: string;
  offset?: [number, number];
}

export const useMapMarker = () => {
  const createMarker = (map: any, options: MarkerOptions) => {
    if (!window.AMap || !map) return null;

    const markerConfig: any = {
      position: options.position,
      title: options.title,
      offset: new window.AMap.Pixel(options.offset?.[0] || 0, options.offset?.[1] || 0),
    };

    // 如果提供了自定义内容
    if (options.content) {
      markerConfig.content = options.content;
    }

    // 如果提供了图标
    if (options.icon) {
      markerConfig.icon = new window.AMap.Icon({
        image: options.icon,
        size: new window.AMap.Size(32, 32),
        imageSize: new window.AMap.Size(32, 32),
      });
    }

    const marker = new window.AMap.Marker(markerConfig);
    marker.setMap(map);

    return marker;
  };

  const createNumberedMarker = (
    map: any,
    position: [number, number],
    number: number,
    color: string = '#667eea'
  ) => {
    const content = `
      <div style="
        width: 32px;
        height: 32px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${number}
      </div>
    `;

    return createMarker(map, {
      position,
      content,
      offset: [-16, -16],
    });
  };

  const createStartMarker = (map: any, position: [number, number]) => {
    const content = `
      <div style="
        width: 40px;
        height: 40px;
        background-color: #4CAF50;
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 18px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.4);
      ">
        起
      </div>
    `;

    return createMarker(map, {
      position,
      content,
      offset: [-20, -20],
    });
  };

  const removeMarker = (marker: any) => {
    if (marker && marker.setMap) {
      marker.setMap(null);
    }
  };

  return {
    createMarker,
    createNumberedMarker,
    createStartMarker,
    removeMarker,
  };
};
