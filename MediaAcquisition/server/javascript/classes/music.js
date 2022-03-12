/**
 * A music object
 */
class Music {
    /**
    * A constructor
    */
    constructor(
        id,
        metadata,
        youtubeLink,
        filePath,
        flagCount,
        unFlaggable,
        createdBy,
        createdAt,
        deletedBy,
        deletedAt
    ) {
        this.Id = id;
        this.Metadata = metadata;
        this.YoutubeLink = youtubeLink;
        this.FilePath = filePath;
        this.FlagCount = flagCount;
        this.UnFlaggable = unFlaggable;
        this.CreatedBy = createdBy;
        this.CreatedAt = createdAt;
        this.DeletedBy = deletedBy;
        this.DeletedAt = deletedAt;
    }
}

module.exports = Music