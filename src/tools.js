
export async function download_image(src,name='download') {
    const a = document.createElement('a');
    a.href = src;
    a.download = name+".webp"
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
}

export function generateImageWithText(width, height, text, fontSizeRatio = 8) {
    // 创建离屏canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    // 设置画布尺寸
    canvas.width = width;
    canvas.height = height;

    // 创建斜角渐变背景（灰色系）
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(1, '#e0c3fc');     // 深灰
    gradient.addColorStop(0, '#8ec5fc');     // 浅灰

    // 绘制背景
    // ctx.fillStyle = gradient;
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 设置文字样式
    ctx.fillStyle = '#578857';  // 画布提示词颜色
    let fontsize = width / fontSizeRatio;  // 使用参数控制字体大小
    ctx.font = `bold ${fontsize}px "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
	
	// 处理多行文本
	const lines = text.split('\n');
	const lineHeight = fontsize * 1.2;// 行高设置为字体的1.2倍
	
    
    // 计算文本总高度
    const totalTextHeight = lines.length * lineHeight;
    
    // 计算起始Y位置（垂直居中）
    const startY = (canvas.height - totalTextHeight) / 2 + fontsize / 2;

    // 绘制每一行文本
    lines.forEach((line, index) => {
        const y = startY + (index * lineHeight);
        ctx.fillText(line, canvas.width / 2, y);
    });

    // 创建圆角效果
    const roundedCanvas = document.createElement('canvas');
    const rctx = roundedCanvas.getContext('2d');
    roundedCanvas.width = canvas.width;
    roundedCanvas.height = canvas.height;

    // 创建圆角矩形路径
    rctx.beginPath();
    rctx.roundRect(0, 0, canvas.width, canvas.height, 20);
    rctx.closePath();
    rctx.clip();
    // 绘制原始图像
    rctx.drawImage(canvas, 0, 0);
    // 返回图片URL
    return roundedCanvas.toDataURL('image/png');
}