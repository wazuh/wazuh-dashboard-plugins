const { DateFormatter } = require('./date-formatter');

describe('DateFormatter', () => {
  describe('tokens', () => {
    describe('tokens.D', () => {
      it('should_format_day_token_with_leading_zero', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(1);
        expect(DateFormatter.tokens.D(actualDate)).toBe('01');
      });
      it('should_format_day_token_without_leading_zero', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(15);
        expect(DateFormatter.tokens.D(actualDate)).toBe('15');
      });
    });
    describe('tokens.M', () => {
      it('should_format_month_token_with_leading_zero', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setMonth(0);
        expect(DateFormatter.tokens.M(actualDate)).toBe('01');
      });
      it('should_format_month_token_without_leading_zero', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setMonth(11);
        expect(DateFormatter.tokens.M(actualDate)).toBe('12');
      });
    });
    describe('tokens.A', () => {
      it('should_format_day_name_for_first_day_of_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(1);
        expect(DateFormatter.tokens.A(actualDate)).toBe('Sunday');
      });
      it('should_format_day_name_for_second_day_of_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(2);
        expect(DateFormatter.tokens.A(actualDate)).toBe('Monday');
      });
      it('should_format_day_name_for_third_day_of_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(3);
        expect(DateFormatter.tokens.A(actualDate)).toBe('Tuesday');
      });
      it('should_format_day_name_for_fourth_day_of_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(4);
        expect(DateFormatter.tokens.A(actualDate)).toBe('Wednesday');
      });
      it('should_format_day_name_for_fifth_day_of_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(5);
        expect(DateFormatter.tokens.A(actualDate)).toBe('Thursday');
      });
      it('should_format_day_name_for_sixth_day_of_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(6);
        expect(DateFormatter.tokens.A(actualDate)).toBe('Friday');
      });
      it('should_format_day_name_for_seventh_day_of_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(7);
        expect(DateFormatter.tokens.A(actualDate)).toBe('Saturday');
      });
      it('should_format_day_name_for_eighth_day_of_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(8);
        expect(DateFormatter.tokens.A(actualDate)).toBe('Sunday');
      });
      it('should_format_day_name_for_last_day_of_previous_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(0);
        expect(DateFormatter.tokens.A(actualDate)).toBe('Saturday');
      });
    });
    describe('tokens.E', () => {
      it('should_format_abbreviated_day_name_for_first_day_of_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(1);
        expect(DateFormatter.tokens.E(actualDate)).toBe('Sun');
      });
      it('should_format_abbreviated_day_name_for_second_day_of_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(2);
        expect(DateFormatter.tokens.E(actualDate)).toBe('Mon');
      });
      it('should_format_abbreviated_day_name_for_third_day_of_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(3);
        expect(DateFormatter.tokens.E(actualDate)).toBe('Tue');
      });
      it('should_format_abbreviated_day_name_for_fourth_day_of_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(4);
        expect(DateFormatter.tokens.E(actualDate)).toBe('Wed');
      });
      it('should_format_abbreviated_day_name_for_fifth_day_of_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(5);
        expect(DateFormatter.tokens.E(actualDate)).toBe('Thu');
      });
      it('should_format_abbreviated_day_name_for_sixth_day_of_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(6);
        expect(DateFormatter.tokens.E(actualDate)).toBe('Fri');
      });
      it('should_format_abbreviated_day_name_for_seventh_day_of_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(7);
        expect(DateFormatter.tokens.E(actualDate)).toBe('Sat');
      });
      it('should_format_abbreviated_day_name_for_eighth_day_of_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(8);
        expect(DateFormatter.tokens.E(actualDate)).toBe('Sun');
      });
      it('should_format_abbreviated_day_name_for_last_day_of_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setDate(0);
        expect(DateFormatter.tokens.E(actualDate)).toBe('Sat');
      });
    });
    describe('tokens.J', () => {
      it('should_format_full_month_name_for_january', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setMonth(0);
        expect(DateFormatter.tokens.J(actualDate)).toBe('January');
      });
      it('should_format_full_month_name_for_february', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setMonth(1);
        expect(DateFormatter.tokens.J(actualDate)).toBe('February');
      });
      it('should_format_full_month_name_for_march', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setMonth(2);
        expect(DateFormatter.tokens.J(actualDate)).toBe('March');
      });
      it('should_format_full_month_name_for_april', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setMonth(3);
        expect(DateFormatter.tokens.J(actualDate)).toBe('April');
      });
      it('should_format_full_month_name_for_may', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setMonth(4);
        expect(DateFormatter.tokens.J(actualDate)).toBe('May');
      });
      it('should_format_full_month_name_for_june', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setMonth(5);
        expect(DateFormatter.tokens.J(actualDate)).toBe('June');
      });
      it('should_format_full_month_name_for_july', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setMonth(6);
        expect(DateFormatter.tokens.J(actualDate)).toBe('July');
      });
      it('should_format_full_month_name_for_august', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setMonth(7);
        expect(DateFormatter.tokens.J(actualDate)).toBe('August');
      });
      it('should_format_full_month_name_for_september', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setMonth(8);
        expect(DateFormatter.tokens.J(actualDate)).toBe('September');
      });
      it('should_format_full_month_name_for_october', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setMonth(9);
        expect(DateFormatter.tokens.J(actualDate)).toBe('October');
      });
      it('should_format_full_month_name_for_november', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setMonth(10);
        expect(DateFormatter.tokens.J(actualDate)).toBe('November');
      });
      it('should_format_full_month_name_for_december', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setMonth(11);
        expect(DateFormatter.tokens.J(actualDate)).toBe('December');
      });
      it('should_format_full_month_name_for_thirteenth_month', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setMonth(12);
        expect(DateFormatter.tokens.J(actualDate)).toBe('January');
      });
      it('should_format_full_month_name_for_previous_year_december', () => {
        const actualDate = new Date('2024-09-19T00:40:18.573Z');
        actualDate.setMonth(-1);
        expect(DateFormatter.tokens.J(actualDate)).toBe('December');
      });
    });
  });
  describe('format', () => {
    it('should_format_date_to_iso_string', () => {
      const actualDate = new Date('2024-09-19T00:40:18.573Z');
      expect(DateFormatter.format(actualDate)).toBe('2024-09-19T00:40:18.573Z');
    });
    it('should_format_date_with_custom_format_string', () => {
      const actualDate = new Date('2024-09-19T00:40:18.573Z');
      expect(DateFormatter.format(actualDate, 'Y-M-DTh:m:s.lZ')).toBe('2024-09-19T00:40:18.573Z');
    });
    it('should_format_date_with_custom_format_without_timezone', () => {
      const actualDate = new Date('2024-09-19T00:40:18.573Z');
      expect(DateFormatter.format(actualDate, 'Y-M-D-h-m-s-l')).toBe('2024-09-19-00-40-18-573');
    });
    it('should_format_date_with_day_name_and_custom_format', () => {
      const actualDate = new Date('2024-09-19T00:40:18.573Z');
      expect(DateFormatter.format(actualDate, 'E N D h:m:s.l Y')).toBe('Thu Sep 19 00:40:18.573 2024');
    });
    it('should_format_date_with_abbreviated_month_and_custom_time', () => {
      const actualDate = new Date('2024-09-19T00:40:18.573Z');
      expect(DateFormatter.format(actualDate, 'N D h:m:s')).toBe('Sep 19 00:40:18');
    });
    it('should_format_date_in_log_format_with_abbreviated_month', () => {
      const actualDate = new Date('2024-09-19T00:40:18.573Z');
      expect(DateFormatter.format(actualDate, 'D/N/Y:h:m:s +0000')).toBe('19/Sep/2024:00:40:18 +0000');
    });
    it('should_format_date_with_iso_format_and_timezone', () => {
      const actualDate = new Date('2024-09-19T00:40:18.573Z');
      expect(DateFormatter.format(actualDate, 'Y-M-DTh:m:s.l+0000')).toBe('2024-09-19T00:40:18.573+0000');
    });
    it('should_format_date_with_custom_separator_and_time', () => {
      const actualDate = new Date('2024-09-19T00:40:18.573Z');
      expect(DateFormatter.format(actualDate, 'Y/M/D/h')).toBe('2024/09/19/00');
    });
    it('should_format_date_with_custom_format_and_hyphen_separator', () => {
      const actualDate = new Date('2024-09-19T00:40:18.573Z');
      expect(DateFormatter.format(actualDate, 'Y-M-D-h-m-s')).toBe('2024-09-19-00-40-18');
    });
  });
});
