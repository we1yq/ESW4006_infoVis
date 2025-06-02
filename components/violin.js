class Violinplot {
    constructor(svg, width = 700, height = 300) {
        this.svg = svg;
        this.width = width;
        this.height = height;
        this.margin = { top: 30, right: 20, bottom: 40, left: 40 };
        this.attributes = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"];
    }

    initialize() {
        this.svg = d3.select(this.svg);
        this.svg
            .attr("width", this.width)
            .attr("height", this.height);

        this.container = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    }

    update(data, cropName, color) {
        this.svg.selectAll("text.title").remove();
        this.container.selectAll("*").remove();

        const innerWidth = this.width - this.margin.left - this.margin.right;
        const innerHeight = this.height - this.margin.top - this.margin.bottom;

        const x = d3.scaleBand()
            .domain(this.attributes)
            .range([0, innerWidth])
            .padding(0.3);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d3.max(this.attributes, attr => +d[attr]))])
            .nice()
            .range([innerHeight, 0]);

        const kde = this.kernelDensityEstimator(this.kernelEpanechnikov(7), y.ticks(40));

        const allDensity = this.attributes.map(attr => {
            const values = data.map(d => +d[attr]).sort(d3.ascending);
            const q1 = d3.quantile(values, 0.25);
            const median = d3.quantile(values, 0.5);
            const q3 = d3.quantile(values, 0.75);
            const iqr = q3 - q1;
            const ciLow = d3.quantile(values, 0.025);
            const ciHigh = d3.quantile(values, 0.975);

            return {
                key: attr,
                values,
                density: kde(values),
                q1, median, q3, iqr, ciLow, ciHigh
            };
        });

        const maxDensity = d3.max(allDensity, d => d3.max(d.density, dd => dd[1]));
        const xViolin = d3.scaleLinear().range([0, x.bandwidth() * 0.6]).domain([0, maxDensity]);

        this.container.append("g")
            .call(d3.axisLeft(y));

        this.container.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x));

        const g = this.container.selectAll(".violin")
            .data(allDensity)
            .join("g")
            .attr("transform", d => `translate(${x(d.key) + x.bandwidth() / 2},0)`);

        g.append("path")
            .datum(d => d.density)
            .attr("fill", d3.color(color).brighter(1.2))
            .attr("stroke", color)
            .attr("stroke-width", 1)
            .attr("d", d3.area()
                .x0(d => -xViolin(d[1]))
                .x1(d => xViolin(d[1]))
                .y(d => y(d[0]))
                .curve(d3.curveCatmullRom)
            );


        g.append("circle")
            .attr("cy", d => y(d.median))
            .attr("r", 4)
            .attr("fill", "white")
            .attr("stroke", "#004080");

        g.append("circle")
            .attr("cy", d => y(d.q1))
            .attr("r", 3)
            .attr("fill", "white")
            .attr("stroke", "#004080");

        g.append("circle")
            .attr("cy", d => y(d.q3))
            .attr("r", 3)
            .attr("fill", "white")
            .attr("stroke", "#004080");

        g.append("circle")
            .attr("cy", d => y(d.ciLow))
            .attr("r", 3)
            .attr("fill", "white")
            .attr("stroke", "#004080");

        g.append("circle")
            .attr("cy", d => y(d.ciHigh))
            .attr("r", 3)
            .attr("fill", "white")
            .attr("stroke", "#004080");

    }

    kernelDensityEstimator(kernel, X) {
        return function (V) {
            return X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
        };
    }

    kernelEpanechnikov(k) {
        return function (v) {
            return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
        };
    }
}
