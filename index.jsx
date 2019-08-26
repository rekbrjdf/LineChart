import React, { Fragment, useState } from 'react';

import { Button, Select, Popover } from 'antd';
import { Stage, Layer, Rect, Line, Text } from 'react-konva';
import moment from 'moment';
import { useSize } from 'react-use';

import styles from './LineChart.less';

const { Option } = Select;

export default function LineChart({
  translations,
  start,
  end,
  data,
  separateData,
  quickChargeValue,
  currentTimeRange,
  setQuickChargeValue,
  goBackInTime,
  goForwardInTime,
}) {
  const [isSeparateDataVisible, setIsSeparateDataVisible] = useState(false);

  function handleExpandButtonClick() {
    setIsSeparateDataVisible(!isSeparateDataVisible);
  }

  const defaultClickedState = { id: undefined, coordinates: { x: undefined, y: undefined } };

  const [clickedState, setClickedState] = useState(defaultClickedState);

  function handleRectangleMouseMove(id, evt) {
    setClickedState({ id, coordinates: { x: evt.clientX, y: evt.clientY } });
  }

  function handleRectangleMouseLeave() {
    setClickedState(defaultClickedState);
  }

  function handleRectangleTouchStart(id, evt) {
    setClickedState({ id, coordinates: { x: evt.touches[0].clientX, y: evt.touches[0].clientY } });
  }

  const totalDuration = end - start;

  const separateChartHeight = 60;

  const [sizedStage] = useSize(({ width }) => {
    if (width === Infinity || totalDuration === 0) {
      return <div />;
    }

    const coefficient = width / totalDuration;

    function getLineX(from) {
      return (from - start) * coefficient;
    }

    function getLineWidth(from, to) {
      return (to - from) * coefficient;
    }

    const tickCount = width === Infinity ? 0 : Math.round(width / 100);
    const ticks = Array.from({ length: tickCount });
    const textWidth = 100;

    const fontSizeBase = parseInt(styles.fontSizeBase, 10);
    const fontSizeSm = parseInt(styles.fontSizeSm, 10);

    return (
      <div>
        <Stage
          width={width}
          height={
            isSeparateDataVisible
              ? separateChartHeight + separateData.length * separateChartHeight
              : separateChartHeight
          }
        >
          <Layer>
            <Line points={[0, 26, width, 26]} stroke="#CACCD2" strokeWidth={8} />
            <Line points={[0, 29, width, 29]} stroke="#E3E8EA" strokeWidth={12} />
            <Text
              x={0}
              y={0}
              text={moment.unix(start).format('LT')}
              fontSize={fontSizeBase}
              fontStyle="bold"
              fill="#000000"
            />
            {ticks.map((ignore, index) => {
              const timeFromStartToTick = (totalDuration / tickCount) * index;
              const tickTimestamp = start + timeFromStartToTick;
              const tickX = timeFromStartToTick * coefficient;

              return (
                index !== 0 && (
                  // eslint-disable-next-line react/no-array-index-key
                  <Fragment key={index}>
                    <Text
                      x={tickX - textWidth / 2}
                      y={2}
                      width={textWidth}
                      align="center"
                      text={moment.unix(tickTimestamp).format('LT')}
                      fontSize={fontSizeSm}
                      fill="#9FA3AE"
                    />
                    <Line points={[tickX, 16, tickX, 23]} stroke="#C4C4C4" strokeWidth={1} />
                    <Line
                      points={[tickX, 24, tickX, 30]}
                      stroke="#CACCD2"
                      strokeWidth={1}
                      dash={[1]}
                    />
                  </Fragment>
                )
              );
            })}
            <Text
              x={width - textWidth}
              y={0}
              width={textWidth}
              text={moment.unix(end).format('LT')}
              fontSize={fontSizeBase}
              align="right"
              fontStyle="bold"
              fill="#000000"
            />

            {data.map(({ id, color, from, to }) => {
              return (
                <Rect
                  key={id}
                  fill={color}
                  x={getLineX(from)}
                  y={30}
                  width={getLineWidth(from, to)}
                  height={28}
                  onMouseMove={({ evt }) => handleRectangleMouseMove(id, evt)}
                  onMouseLeave={handleRectangleMouseLeave}
                  onTouchStart={({ evt }) => handleRectangleTouchStart(id, evt)}
                  onTouchEnd={handleRectangleMouseLeave}
                />
              );
            })}
            {isSeparateDataVisible &&
              separateData.map(({ data: timeRanges, name }, index) => {
                const lineHeight = 18;
                const fontSize = fontSizeBase;
                const chartY = index * separateChartHeight + separateChartHeight + 10;
                const topLineY = chartY + fontSize + 5;

                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <Fragment key={index}>
                    <Text x={0} y={chartY} text={name} fontSize={fontSize} fill="#2B344B" />
                    <Rect fill="#EEEFF1" x={0} y={topLineY} width={width} height={lineHeight} />
                    {timeRanges.map(({ color, from, to, id }) => (
                      <Rect
                        key={id}
                        fill={color}
                        x={getLineX(from)}
                        y={topLineY}
                        width={getLineWidth(from, to)}
                        height={lineHeight}
                        onMouseMove={({ evt }) => handleRectangleMouseMove(id, evt)}
                        onMouseLeave={handleRectangleMouseLeave}
                        onTouchStart={({ evt }) => handleRectangleTouchStart(id, evt)}
                        onTouchEnd={handleRectangleMouseLeave}
                      />
                    ))}
                  </Fragment>
                );
              })}
          </Layer>
        </Stage>
      </div>
    );
  });

  const expandButtonIcon = isSeparateDataVisible ? 'up' : 'down';
  const isShiftMode = quickChargeValue === 'shift';

  function StatePopover() {
    if (clickedState.id === undefined) {
      return null;
    }

    const { info } = data.find(({ id }) => clickedState.id === id);

    if (info === undefined) {
      return null;
    }

    const paramTable = (
      <table className={styles.table}>
        <tbody>
          {clickedState.id !== undefined &&
            Object.keys(info).map(key => (
              <tr key={key}>
                <td>{translations[key]}</td>
                <td>{info[key]}</td>
              </tr>
            ))}
        </tbody>
      </table>
    );

    return (
      <Popover visible content={paramTable} transitionName="(.)(.)">
        <div
          className={styles.popoverChild}
          style={{ top: clickedState.coordinates.y, left: clickedState.coordinates.x }}
        />
      </Popover>
    );
  }

  return (
    <div className={styles.header}>
      <div className={styles.title}>{translations.lineChart}</div>
      <div className={styles.timer}>
        <Button icon="left" onClick={goBackInTime} disabled={isShiftMode} />
        <div className={styles.input}>{currentTimeRange}</div>
        <Button icon="right" onClick={goForwardInTime} disabled={isShiftMode} />
      </div>
      <Select
        className={styles.selectorRange}
        value={quickChargeValue}
        onChange={setQuickChargeValue}
      >
        <Option value="minutes">{translations.minutes}</Option>
        <Option value="halfHour">{translations.halfHour}</Option>
        <Option value="hour">{translations.hour}</Option>
        <Option value="shift">{translations.shift}</Option>
      </Select>
      <div className={styles.lineChart}>
        {sizedStage}
        <StatePopover />
      </div>

      <Button className={styles.button} icon={expandButtonIcon} onClick={handleExpandButtonClick} />
    </div>
  );
}
