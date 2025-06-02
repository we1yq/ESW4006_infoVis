class PC {
    margin = {
        top: 70, right: 50, bottom: 50, left: 50
    }

    constructor(svg, data, dimensions, width = 1050, height = 400) {
        this.svg = svg;
        this.data = data;
        this.dimensions = dimensions;
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
        this.container = this.svg.append("g");

        this.xScale = d3.scalePoint()
            .range([0, this.width])
            .domain(this.dimensions);

        this.yScales = {};
        this.dimensions.forEach(dim => {
            this.yScales[dim] = d3.scaleLinear()
                .domain(d3.extent(data, d => d[dim]))
                .range([this.height, 0])
        });

        this.axes = this.container.append("g");
        this.titles = this.container.append("g");
        this.lines = this.container.append("g");
        this.focusedLines = this.container.append("g");

        //this.zScale = d3.scaleOrdinal().range(d3.schemeDark2.concat(d3.schemePaired));

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        this.svg.append("text")
            .attr("x", this.width/2 + this.margin.left/2 + this.margin.right/2)
            .attr("y", this.margin.top - 50)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text("Crop Comparison");
    }

    update(brushedData, colorVar) {
        this.zScale.domain([...new Set(this.data.map(d => d[colorVar]))])

        this.axes.selectAll("g.axis")
            .data(this.dimensions)
            .join("g")
            .attr("class", "axis")
            .attr("transform", dim => `translate(${this.xScale(dim)}, 0)`)
            .each((dim, i, nodes) => {
                d3.select(nodes[i]).call(d3.axisLeft(this.yScales[dim]))
            })

        this.titles.selectAll("text")
            .data(this.dimensions)
            .join("text")
            .attr("transform", dim => `translate(${this.xScale(dim)}, 0)`)
            .text(dim => dim)
            .attr("text-anchor", "middle")
            .attr("font-size", ".9rem")
            .attr("dy", "-.8rem")


        let polyline = (d) => {
            return d3.line().curve(d3.curveCatmullRom.alpha(0.6))(this.dimensions.map(dim => [this.xScale(dim), this.yScales[dim](d[dim])]));
        }


        this.lines
            .selectAll("path")
            .data(this.data)
            .join("path")
            .attr("d", polyline)
            .style("fill", "none")
            .style("stroke", d => this.zScale(d[colorVar]))
            .style("stroke", "#ccc")             
            .style("stroke-opacity", 0.03);

        this.focusedLines
            .selectAll("path")
            .data(brushedData)
            .join("path")
            .attr("d", polyline)
            .style("fill", "none")
            .style("stroke", d => this.zScale(d[colorVar]))
            .style("opacity", 1)
    }
}