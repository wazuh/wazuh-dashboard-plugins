import styled from 'styled-components';

const Center = styled.div`
    width: 100%;
    height: calc(100vh - 60px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
`;

export default Center;

export const ColumnCenter = styled(Center)`
    flex-flow: column;
    justify-content: center;
`;
