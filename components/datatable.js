class DataTable {
    margin = {
        top: 10, right: 10, bottom: 40, left: 40
    }
    constructor(id) {
        this.id = id;
    }

    update(data, columns) {
        let table = d3.select(this.id);


        let rows = table
            .selectAll("tr")
            .data(data)
            .join("tr");

        rows.selectAll("td")
            .data(d => columns.map(c => d[c]))
            .join("td")
            .text(d => d)
    }
}
