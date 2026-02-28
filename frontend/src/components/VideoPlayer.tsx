import './VideoPlayer.css'

interface VideoPlayerProps {
  videoUrl: string
}

export default function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  const handleDownload = () => {
    window.open(videoUrl, '_blank')
  }

  return (
    <div className="video-player">
      <video
        src={videoUrl}
        controls
        className="video-element"
        preload="metadata"
      >
        您的浏览器不支持视频播放
      </video>

      <div className="video-actions">
        <button onClick={handleDownload} className="download-btn">
          📥 下载 4K 视频
        </button>
      </div>
    </div>
  )
}
