/**
 * The xpath comming from the llm contains things like "@class='title'" which will not match because we filter out if the element has more than one class.
 * 
 * In order to imrpove the matching, we will turn "@class='class1 class2 class3'" into "contains(@class, 'class1') and contains(@class, 'class2') and contains(@class, 'class3')"
 */

const re = /@class='([^']+)'/g;

export default function ClassMatchToClassContains(xpath: string) {
    return xpath.replace(re, (_, classes) => {
        const classList = classes.split(' ') as string[];
        return classList.map(c => `contains(@class, '${c}')`).join(' and ');
    });
}