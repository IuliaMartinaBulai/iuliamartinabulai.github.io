unitsize(1cm);
settings.tex = "pdflatex";

picture pic;
pen p = black+squarecap;

draw(pic, arc((0.12,0.5), 0.5, -90, 90), p+7);
draw(pic, arc((0.12,-0.5), 0.5, -90, 90), p+7);
draw(pic, (0,-0.83) -- (0,0.5) -- (-0.4,0) -- (-0.8,0.5), p+7);
draw(pic, (-.8,-1.175) -- (-.8,1.18), p+7);

add(yscale(0.71)*pic);
