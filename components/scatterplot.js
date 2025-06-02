class Scatterplot {
    margin = {
        top: 20, right: 125, bottom: 80, left: 40
    }

    constructor(svg, tooltip, data, width = 400, height = 400) {
        this.svg = svg;
        this.tooltip = tooltip;
        this.data = data;
        this.width = width;
        this.height = height;
        this.handlers = {};
        const pairedFixed = d3.schemePaired.slice();
        pairedFixed[10] = "#d4a017";
        pairedFixed[12] = "#6b6ecf";
        pairedFixed[13] = "#e377c2";
        this.zScale = d3.scaleOrdinal().range(d3.schemeDark2.concat(pairedFixed));

    }

    initialize() {
        this.svg = d3.select(this.svg);
        this.tooltip = d3.select(this.tooltip);
        this.container = this.svg.append("g");
        this.xAxis = this.svg.append("g");
        this.yAxis = this.svg.append("g");
        this.legend = this.svg.append("g");

        this.xScale = d3.scaleLinear();
        this.yScale = d3.scaleLinear();
        //this.zScale = d3.scaleOrdinal().range(d3.schemeCategory10)
        //this.zScale = d3.scaleOrdinal().range(this.colorPalette);

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        this.brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]])
            .on("start brush", (event) => {
                this.brushCircles(event);
            })

                
        this.svg.append("text")
            .attr("x", this.width/2 + this.margin.left)
            .attr("y", this.margin.top + this.height + 50)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text("Crop Distribution");
    }

    update(xVar, yVar, colorVar, useColor) {
        this.xVar = xVar;
        this.yVar = yVar;

        this.xScale.domain(d3.extent(this.data, d => d[xVar])).range([0, this.width]);
        this.yScale.domain(d3.extent(this.data, d => d[yVar])).range([this.height, 0]);
        this.zScale.domain([...new Set(this.data.map(d => d[colorVar]))])

        this.container.call(this.brush);

        this.circles = this.container.selectAll("circle")
            .data(data)
            .join("circle")
            .on("mouseover", (e, d) => {
                this.tooltip.select(".tooltip-inner")
                    .html(
                        `${this.xVar}: ${d[this.xVar]}<br/>
                        ${this.yVar}: ${d[this.yVar]}<br/>
                        ${colorVar}: ${d[colorVar]}`
                    );
                    //.html(`${this.xVar}: ${d[this.xVar]}<br />${this.yVar}: ${d[this.yVar]}`);

                Popper.createPopper(e.target, this.tooltip.node(), {
                    placement: 'top',
                    modifiers: [
                        {
                            name: 'arrow',
                            options: {
                                element: this.tooltip.select(".tooltip-arrow").node(),
                            },
                        },
                        {
                            name: 'offset',
                            options: {
                                offset: [0, 10],
                            },
                        },
                    ],
                });

                this.tooltip.style("display", "block");
            })
            .on("mouseout", (d) => {
                this.tooltip.style("display", "none");
            });

        this.circles
            .transition()
            .attr("cx", d => this.xScale(d[xVar]))
            .attr("cy", d => this.yScale(d[yVar]))
            .attr("fill", useColor ? d => this.zScale(d[colorVar]) : "black")
            .attr("r", 3)

        this.xAxis
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.height})`)
            .transition()
            .call(d3.axisBottom(this.xScale));

        this.yAxis
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
            .transition()
            .call(d3.axisLeft(this.yScale));

        if (useColor) {
            //const fullColors = d3.schemeDark2.concat(d3.schemePaired);
            const pairedFixed = d3.schemePaired.slice();
            pairedFixed[10] = "#d4a017";
            pairedFixed[12] = "#6b6ecf";
            pairedFixed[13] = "#e377c2";
            const fullColors = d3.schemeDark2.concat(pairedFixed);
            const labels = this.zScale.domain();  
            const half = Math.ceil(labels.length / 2);

            const leftLabels = labels.slice(0, half);
            const rightLabels = labels.slice(half);

            const leftScale = d3.scaleOrdinal().domain(leftLabels).range(fullColors.slice(0, leftLabels.length));
            const rightScale = d3.scaleOrdinal().domain(rightLabels).range(fullColors.slice(half, half + rightLabels.length));

           /* this.legend.selectAll("*").remove();
            this.legend.style("display", "inline").style("font-size", ".8em");

            this.legend.append("g")
                .style("display", "inline")
                .style("font-size", ".8em")
                .attr("transform", `translate(${this.width + this.margin.left + 10}, ${this.height/5})`)
                .call(d3.legendColor().scale(leftScale))
           
            this.legend.append("g")
                .style("display", "inline")
                .style("font-size", ".8em")
                .attr("transform", `translate(${this.width + this.margin.left + 110}, ${this.height/5})`)
                .call(d3.legendColor().scale(rightScale))*/
            this.legend
                .style("display", "inline")
                .style("font-size", ".7em")
                .attr("transform", `translate(${this.width + this.margin.left + 10},  ${this.height/10})`)
                .call(d3.legendColor().scale(this.zScale))
        }
        else {
            this.legend.style("display", "none");
        }
    }

    isBrushed(d, selection) {
        let [[x0, y0], [x1, y1]] = selection; // destructuring assignment
        let x = this.xScale(d[this.xVar]);
        let y = this.yScale(d[this.yVar]);

        return x0 <= x && x <= x1 && y0 <= y && y <= y1;
    }

    // this method will be called each time the brush is updated.
    brushCircles(event) {
        let selection = event.selection;

        this.circles.classed("brushed", d => this.isBrushed(d, selection));

        if (this.handlers.brush)
            this.handlers.brush(this.data.filter(d => this.isBrushed(d, selection)));
    }

    on(eventType, handler) {
        this.handlers[eventType] = handler;
    }
}