export const awaitTimer = (condition, callback, iterator) => {
    let i = iterator || 0;

    if (condition()) {
        callback();
    } else if (i < 10) {
        i++;

        setTimeout(() => {
            awaitTimer(condition, callback, i);
        }, 1000);
    }
}