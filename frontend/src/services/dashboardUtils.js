export function calculateOverallProgress(progress) {

    if (!progress || progress.length === 0) {
        return 0;
    }


    const total = progress.reduce(
        (sum, item) => {
            return sum + item.completionPercentage;
        },
        0
    );


    return Math.round(
        total / progress.length
    );
}