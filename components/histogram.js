class Histogram {
    margin = {
        top: 20, right: 50, bottom: 80, left: 100
    }

    constructor(svg, tooltip, width = 400, height = 400) {
        this.svg = svg;
        this.tooltip = tooltip;
        this.width = width;
        this.height = height;

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

        this.yScale = d3.scaleBand();
        this.xScale = d3.scaleLinear();

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
        
        this.svg.append("text")
            .attr("x", this.width/2 + this.margin.left/2 + this.margin.right)
            .attr("y", this.margin.top + this.height + 50)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text("Crop Frequency");

    }

    update(data, yVar) {
        const categories = [...new Set(data.map(d => d[yVar]))]
        const counts = {};
        categories.forEach(c => {
            counts[c] = data.filter(d => d[yVar] === c).length;
        });

        this.yScale.domain(categories).range([0, this.height]).padding(0.3);
        this.xScale.domain([0, d3.max(Object.values(counts))]).range([0, this.width]);

        this.container.selectAll("rect")
            .data(categories)
            .join("rect")
            .attr("y", d => this.yScale(d))
            .attr("x", 0)
            .attr("height", this.yScale.bandwidth())
            .attr("width", d => this.xScale(counts[d]))
            .attr("fill", d => this.zScale(d))
            .on("mouseover", (e, d) => {
                this.tooltip.select(".tooltip-inner")
                    .html(
                        `${yVar}: ${d}<br/>
                        count: ${counts[d]}`
                );

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
        .on("mouseout", () => {
            this.tooltip.style("display", "none");
        })
        .on("dblclick", (e, d) => {
            const crop = d; 
            d3.select("#violinTitle").text(`Violin Plot: ${crop}`);
            const selectdata = data.filter(row => row[yVar] === crop);
            const color = this.zScale(crop); 
            violinplot.update(selectdata, crop, color);
            const modal = new bootstrap.Modal(document.getElementById('violinModal'));
            modal.show();
        });


        this.yAxis
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
            .call(d3.axisLeft(this.yScale));

        this.xAxis
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.height})`)
            .call(d3.axisBottom(this.xScale).ticks(5));
    }

}