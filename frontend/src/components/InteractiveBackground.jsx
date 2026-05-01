import React, { useEffect, useRef } from 'react';

const InteractiveBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width, height;
    let dots = [];
    const spacing = 35;
    const mouse = { x: -1000, y: -1000 };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initDots();
    };

    const initDots = () => {
      dots = [];
      for (let x = spacing / 2; x < width; x += spacing) {
        for (let y = spacing / 2; y < height; y += spacing) {
          dots.push({ x, y, originX: x, originY: y });
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      dots.forEach(dot => {
        const dx = mouse.x - dot.originX;
        const dy = mouse.y - dot.originY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 250;

        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          dot.x = dot.originX - dx * force * 0.5;
          dot.y = dot.originY - dy * force * 0.5;
        } else {
          dot.x += (dot.originX - dot.x) * 0.1;
          dot.y += (dot.originY - dot.y) * 0.1;
        }

        const opacity = Math.max(0.2, 1 - dist / 600);
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239, 68, 68, ${opacity * 0.9})`; // Brand red
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1,
        pointerEvents: 'none',
        background: '#000'
      }}
    />
  );
};

export default InteractiveBackground;
