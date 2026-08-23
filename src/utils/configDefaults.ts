import { StudentInfo, BorderStyle } from '../types';

export const defaultStudentInfo: StudentInfo = {
    showStudentInfo: true,
    showName: true,
    showClass: true,
    showDate: true,
    showScore: false,
};

export const defaultZoom = 0.55;
export const defaultBorderStyle: BorderStyle = 'none';

export function getBaseConfigDefaults() {
    return {
        studentInfo: { ...defaultStudentInfo },
        borderStyle: defaultBorderStyle as BorderStyle,
        zoom: defaultZoom,
    };
}
