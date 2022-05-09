class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  search() {
    const keyword = this.queryString.keyword
      ? {
          name: {
            $regex: this.queryString.keyword,
            $options: "i",
          },
        }
      : {};
    this.query = this.query.find({ ...keyword });
    return this;
  }

  filter() {
    const queryCopy = { ...this.queryString };
    // remove fields we don't want in query
    const removeFileds = ["keyword", "limit", "page"];
    removeFileds.forEach((el) => delete queryCopy[el]);

    // advanced filter for price category, rating
    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(
      /\b(lt|lte|gt|gte|)\b/g,
      (match) => `$${match}`
    );
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  pagination(resPerPage) {
    const currentPage = Number(this.queryString.page) || 1;
    const skip = resPerPage * (currentPage - 1);
    this.query = this.query.limit(resPerPage).skip(skip);

    return this;
  }
}

module.exports = APIFeatures;
