function toggleBlock(element) {
    // Find the closest parent with class 'block'
    let block = element.closest('.block');
    if (block) {
        if (block.classList.contains('block-collapsed')) {
            block.classList.remove('block-collapsed');
            block.classList.add('block-expanded');
        } else {
            block.classList.remove('block-expanded');
            block.classList.add('block-collapsed');
        }
    }
}