import React from 'react'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import MonacoWrapper from './MonacoWrapper'

const DEFAULT_JAVA_CODE = `public class Sample {
    static int square(int x) {
        return x * x;
    }

    public static void main(String[] args) {
        int a = 5;
        int b = 10;
        int[] arr = {1, 2, 3};
        int sum = 0;
        for (int i = 0; i < arr.length; i++) {
            sum += arr[i];
        }
        int sq = square(a);
        Point p = new Point(a, b);
        System.out.println(sum + sq + p.x);
    }
}

class Point {
    int x, y;
    Point(int x, int y) {
        this.x = x;
        this.y = y;
    }
}`

/**
 * Source Code Viewer Panel.
 * Pulls current step model and highlights the executing line on Monaco Editor.
 */
export const SourceViewerPanel: React.FC = () => {
  const currentModel = usePlaybackStore((state) => state.currentModel)
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)

  const isConnected = connectionStatus === 'CONNECTED'
  const currentLine =
    isConnected && currentModel?.highlights ? currentModel.highlights.currentLine : 0

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <MonacoWrapper sourceCode={DEFAULT_JAVA_CODE} currentLine={currentLine} theme="vs-dark" />
    </div>
  )
}

export default SourceViewerPanel
